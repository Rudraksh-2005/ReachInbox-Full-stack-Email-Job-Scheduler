import { PrismaClient } from '@prisma/client';
import { scheduleEmail } from './services/queue.service';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding mock data...');

  // Create a default user
  const user = await prisma.user.upsert({
    where: { email: 'demo@reachinbox.ai' },
    update: {},
    create: {
      id: 'user_123',
      email: 'demo@reachinbox.ai',
      name: 'Demo User',
    },
  });

  // Clear existing jobs to prevent duplicates if seed is run multiple times
  await prisma.emailJob.deleteMany({
    where: { userId: user.id }
  });

  // Scheduled times (in the future)
  const now = new Date();
  
  const emailsToSeed = [
    {
      subject: 'Following up on our conversation',
      body: 'Hi, I wanted to follow up on our previous discussion regarding the upcoming project. Let me know when you have time.',
      recipient: 'johndoe@example.com',
      scheduledTime: new Date(now.getTime() + 1000 * 60 * 60 * 2), // 2 hours from now
    },
    {
      subject: 'Invitation: Q3 Planning Sync',
      body: 'Please join us for the Q3 planning sync next week. The agenda is attached.',
      recipient: 'sarah.smith@company.com',
      scheduledTime: new Date(now.getTime() + 1000 * 60 * 60 * 24), // 1 day from now
    },
    {
      subject: 'Your recent inquiry',
      body: 'Thank you for reaching out. Our team is reviewing your request and will get back to you shortly.',
      recipient: 'support@client.com',
      scheduledTime: new Date(now.getTime() + 1000 * 60 * 30), // 30 minutes from now
    },
    {
      subject: 'New Feature Announcement: Dark Mode!',
      body: 'We are thrilled to announce that Dark Mode is finally here. Try it out on your dashboard today.',
      recipient: 'users@mailinglist.com',
      scheduledTime: new Date(now.getTime() + 1000 * 60 * 60 * 48), // 2 days from now
    }
  ];

  for (const email of emailsToSeed) {
    // 1. Create in DB
    const emailJob = await prisma.emailJob.create({
      data: {
        userId: user.id,
        senderEmail: 'hello@reachinbox.ai',
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        scheduledTime: email.scheduledTime,
        status: 'SCHEDULED',
      },
    });

    // 2. Add to BullMQ
    const delayMs = email.scheduledTime.getTime() - now.getTime();
    
    const jobData = {
      emailJobId: emailJob.id,
      userId: user.id,
      senderEmail: 'hello@reachinbox.ai',
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
    };

    const bullJob = await scheduleEmail(jobData, delayMs);
    
    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: { bullJobId: bullJob.id?.toString() },
    });

    console.log(`Seeded email to ${email.recipient}`);
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
