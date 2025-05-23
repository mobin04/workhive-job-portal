const express = require('express');
const dotEnv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const globalErrorHandling = require('./middlewares/errorHandling');

dotEnv.config();
connectDB();
const app = express();

app.use(express.json());

app.use(cors());

app.use('/api/v1/auth', authRoutes);

app.use(globalErrorHandling);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`✅ SERVER RUNNING ON PORT: ${PORT} :)`));
