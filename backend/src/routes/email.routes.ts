import { Router } from 'express';
import { scheduleEmail } from '../services/queue.service';
import { PrismaClient } from '@prisma/client';
import { searchEmails } from '../services/elasticsearch.service';

const router = Router();
const prisma = new PrismaClient();

// POST /api/emails/schedule
router.post('/schedule', async (req, res) => {
  try {
    const { userId, senderEmail, emails, delayBetweenEmailsMs, hourlyLimit } = req.body;
    
    // emails should be an array of { subject, body, recipient, scheduledTime }
    const jobs = [];

    // Assuming we have a valid userId for testing
    // If not, let's create a mock user for now if missing
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: 'test@reachinbox.ai',
        },
      });
    }

    let i = 0;
    for (const email of emails) {
      // 1. Create DB entry
      const emailJob = await prisma.emailJob.create({
        data: {
          userId: user.id,
          senderEmail,
          recipient: email.recipient,
          subject: email.subject,
          body: email.body,
          scheduledTime: new Date(email.scheduledTime),
          status: 'SCHEDULED',
        },
      });

      // 2. Schedule in BullMQ
      // Calculate delay from now
      const now = new Date().getTime();
      const scheduledAt = new Date(email.scheduledTime).getTime();
      
      let delayMs = scheduledAt - now;
      if (delayMs < 0) delayMs = 0;
      
      // If we want to add an artificial offset based on the index to mimic immediate queueing
      // delayMs += i * (delayBetweenEmailsMs || 0);

      const jobData = {
        emailJobId: emailJob.id,
        userId: user.id,
        senderEmail,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
      };

      const bullJob = await scheduleEmail(jobData, delayMs);
      
      // Save BullMQ job ID
      await prisma.emailJob.update({
        where: { id: emailJob.id },
        data: { bullJobId: bullJob.id?.toString() },
      });

      jobs.push(emailJob);
      i++;
    }

    res.json({ message: 'Emails scheduled successfully', jobs });
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({ error: 'Failed to schedule emails' });
  }
});

// GET /api/emails/scheduled
router.get('/scheduled', async (req, res) => {
  try {
    const { userId } = req.query;
    const emails = await prisma.emailJob.findMany({
      where: {
        userId: String(userId),
        status: 'SCHEDULED',
      },
      orderBy: { scheduledTime: 'asc' },
    });
    res.json({ emails });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scheduled emails' });
  }
});

// GET /api/emails/sent
router.get('/sent', async (req, res) => {
  try {
    const { userId } = req.query;
    const emails = await prisma.emailJob.findMany({
      where: {
        userId: String(userId),
        status: { in: ['SENT', 'FAILED'] },
      },
      orderBy: { sentAt: 'desc' },
    });
    res.json({ emails });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sent emails' });
  }
});

// GET /api/emails/search
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ emails: [] });
    }
    const results = await searchEmails(String(q));
    res.json({ emails: results });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// DELETE /api/emails/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the email
    const emailJob = await prisma.emailJob.findUnique({ where: { id } });
    if (!emailJob) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // If it's still scheduled, we should remove it from the BullMQ queue
    if (emailJob.status === 'SCHEDULED' && emailJob.bullJobId) {
      const { emailQueue } = require('../services/queue.service');
      const job = await emailQueue.getJob(emailJob.bullJobId);
      if (job) {
        await job.remove();
      }
    }

    // Remove from Elasticsearch if we indexed it
    try {
      const { elasticClient } = require('../services/elasticsearch.service');
      await elasticClient.delete({
        index: 'emails',
        id: emailJob.id,
      });
    } catch (esError) {
      // Ignore if not found in ES
    }

    // Delete from PostgreSQL
    await prisma.emailJob.delete({ where: { id } });

    res.json({ message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete email' });
  }
});

export default router;
