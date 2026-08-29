import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { sendSlackNotification } from './slack.service';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const prisma = new PrismaClient();

export const checkRateLimitAndRecord = async (userId: string, senderEmail: string): Promise<boolean> => {
  const maxEmailsPerHour = parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '200');
  
  // Create a key based on the current hour to reset automatically
  const currentHour = new Date().toISOString().slice(0, 13); // e.g. "2023-10-15T14"
  const rateLimitKey = `ratelimit:${userId}:${senderEmail}:${currentHour}`;
  
  // Increment counter in Redis
  const currentCount = await redis.incr(rateLimitKey);
  
  if (currentCount === 1) {
    // Set expiry for 1 hour (3600 seconds) if it's the first increment
    await redis.expire(rateLimitKey, 3600);
  }
  
  if (currentCount > maxEmailsPerHour) {
    // Notify Slack if limit just exceeded
    if (currentCount === maxEmailsPerHour + 1) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.slackToken) {
        await sendSlackNotification(
          user.slackToken, 
          user.slackChannelId || '',
          `⚠️ Rate limit exceeded for sender ${senderEmail}. Limit is ${maxEmailsPerHour} per hour. Jobs are being rescheduled.`
        );
      }
    }
    return false; // Limit exceeded
  }
  
  return true; // Limit OK
};
