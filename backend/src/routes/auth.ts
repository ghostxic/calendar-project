import express from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Generate Google OAuth URL
router.get('/google', (req, res) => {
  // Create OAuth2 client dynamically to ensure env vars are loaded
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.json({ authUrl });
});

// Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Create OAuth2 client dynamically
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token (using hash router)
    // Use the correct GitHub Pages URL for production
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? `https://ghostxic.github.io/calendar-project/#/auth/callback?token=${jwtToken}`
      : `${process.env.FRONTEND_URL}/#/auth/callback?token=${jwtToken}`;
    console.log('OAuth callback: Redirecting to:', frontendUrl);
    console.log('OAuth callback: FRONTEND_URL env var:', process.env.FRONTEND_URL);
    console.log('OAuth callback: NODE_ENV:', process.env.NODE_ENV);
    res.redirect(frontendUrl);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify JWT token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
