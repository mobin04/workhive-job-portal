const express = require('express');
const http = require('http');
const dotEnv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initSocket } = require('./config/socket');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const globalErrorHandling = require('./middlewares/errorHandling');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const employerRoutes = require('./routes/employerRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotEnv.config();
connectDB();
const app = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/employer', employerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/statistics', statisticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.use(globalErrorHandling);

const server = http.createServer(app);

initSocket(server); // Initialize socket

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`✅ SERVER RUNNING ON PORT: ${PORT} :)`));
