const Job = require('../models/jobModel');

class APIFeatures {
  constructor(query) {
    this.query = query;
  }

  // Pagination
  paginate() {
    const page = parseInt(this.query.page) || 1;
    const limit = parseInt(this.query.limit) || 10;
    const skip = (page - 1) * limit;
    this.pagination = { skip, limit };
    return this;
  }

  // Sorting
  sort() {
    const sortBy = this.query.sort || 'createdAt';
    const sortOrder = this.query.order === 'asc' ? 1 : -1;
    this.sorting = { [sortBy]: sortOrder };
    return this;
  }

  // Filtering
  filter() {
    const excludedFields = ['page', 'limit', 'sort', 'order', 'search'];
    const filters = { ...this.query };
    excludedFields.forEach((field) => delete filters[field]);

    if (filters.salary) {
      filters.salary = { $gte: parseInt(filters.salary) };
    }

    const finalFilter = { ...filters };

    if (this.query.search) {
      const searchRegex = new RegExp(this.query.search, 'i'); // Case-insensitive search

      finalFilter.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { location: searchRegex },
      ];
    }

    this.filters = finalFilter;
    return this;
  }

  // Fetch Jobs
  async fetchJobs() {
    return await Job.find(this.filters)
      .sort(this.sorting)
      .skip(this.pagination.skip)
      .limit(this.pagination.limit)
      .lean();
  }
}

module.exports = APIFeatures;
