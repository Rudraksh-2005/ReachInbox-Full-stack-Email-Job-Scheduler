import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

export const emailQueue = new Queue('email-queue', { connection });

export const scheduleEmail = async (jobData: any, delayMs: number) => {
  return await emailQueue.add('send-email', jobData, {
    delay: delayMs,
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
};
