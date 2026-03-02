import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { apiRouter } from './routes/api';
import { studentStore } from './storage/studentStore';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', apiRouter);

const start = async (): Promise<void> => {
  await studentStore.connect();

  app.listen(port, () => {
    console.log(`Digital Learning Twin backend listening on http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
