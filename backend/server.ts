import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT: string | number = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req:any, res:any) => {
  res.json({ message: 'Backend server and MongoDB are ready with TypeScript!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
