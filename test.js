const axios = require('axios');

async function runTest() {
  try {
    console.log('Testing Email Scheduler API...');
    
    // 1. Schedule Email
    const scheduleRes = await axios.post('http://localhost:4000/api/emails/schedule', {
      userId: 'test-user-1',
      senderEmail: 'sender@reachinbox.ai',
      emails: [
        {
          subject: 'Test Subject 1',
          body: 'Hello from test 1',
          recipient: 'recipient1@example.com',
          scheduledTime: new Date(Date.now() + 2000).toISOString(), // Schedule 2 seconds in the future
        }
      ],
      delayBetweenEmailsMs: 2000,
      hourlyLimit: 10
    });
    
    console.log('Schedule Response:', scheduleRes.data);

    // 2. Wait for 5 seconds for BullMQ to process and send
    console.log('Waiting 5 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Fetch Sent Emails
    const sentRes = await axios.get('http://localhost:4000/api/emails/sent?userId=test-user-1');
    console.log('Sent Emails:', sentRes.data.emails.length > 0 ? 'Success! Emails were sent.' : 'No emails sent yet.');
    console.log(sentRes.data);

  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

runTest();
