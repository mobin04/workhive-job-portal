const express = require('express');
const dotEnv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotEnv.config();
connectDB();
const app = express();

app.use(express.json());

app.use(cors());

app.get('/hello', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'congrats! all the best',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`✅ SERVER RUNNING ON PORT: ${PORT} :)`));
