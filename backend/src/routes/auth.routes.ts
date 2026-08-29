import { Router } from 'express';

const router = Router();

router.get('/slack/callback', (req, res) => {
  // TODO: Handle Slack OAuth callback
  res.send('Slack OAuth Callback');
});

export default router;
