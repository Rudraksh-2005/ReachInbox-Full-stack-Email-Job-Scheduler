import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import emailRoutes from './routes/email.routes';
import './services/worker.service'; // Start the BullMQ worker

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);

app.get('/health', (req, res) => {
  res.send('Scheduler backend is running.');
});

import { setupElasticsearch } from './services/elasticsearch.service';

app.listen(port, async () => {
  await setupElasticsearch();
  console.log(`Server is running on port ${port}`);
});
