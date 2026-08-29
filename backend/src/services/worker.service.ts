import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { checkRateLimitAndRecord } from './rateLimit.service';
import { scheduleEmail } from './queue.service';
import { indexEmail } from './elasticsearch.service';

dotenv.config();

const prisma = new PrismaClient();

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

// Ethereal Email SMTP config
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const worker = new Worker(
  'email-queue',
  async (job: Job) => {
    const { emailJobId, senderEmail, recipient, subject, body, userId } = job.data;

    try {
      // 1. Rate Limiting Check
      const rateLimitOk = await checkRateLimitAndRecord(userId, senderEmail);

      if (!rateLimitOk) {
        // If rate limit exceeded, delay the job by 1 hour (3600000 ms)
        console.warn(`Rate limit exceeded for user ${userId}, delaying job ${emailJobId}`);
        await scheduleEmail(job.data, 60 * 60 * 1000);
        return; // Job gracefully finishes, rescheduled in the future
      }

      // 2. Minimum Delay logic (Simulating provider throttling)
      // Wait for a configurable delay (e.g. 2 seconds) before sending
      const minDelay = parseInt(process.env.MIN_DELAY_BETWEEN_EMAILS_MS || '2000');
      await new Promise(resolve => setTimeout(resolve, minDelay));

      // 3. Send Email
      const info = await transporter.sendMail({
        from: senderEmail,
        to: recipient,
        subject,
        text: body,
      });

      console.log(`Email sent: ${info.messageId}`);

      // 4. Update Database
      const updatedJob = await prisma.emailJob.update({
        where: { id: emailJobId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // 5. Index in Elasticsearch
      await indexEmail({
        id: updatedJob.id,
        subject: updatedJob.subject,
        body: updatedJob.body,
        recipient: updatedJob.recipient,
        senderEmail: updatedJob.senderEmail,
        status: updatedJob.status,
      });

    } catch (error) {
      console.error(`Failed to send email for job ${emailJobId}`, error);
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'), // Configurable concurrency
  }
);

worker.on('failed', (job, err) => {
  if (job) {
    console.error(`Job ${job.id} failed with error ${err.message}`);
  }
});
