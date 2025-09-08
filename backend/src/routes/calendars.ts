import express from 'express';
import { google } from 'googleapis';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get user's calendars
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list();

    res.json(response.data.items || []);
  } catch (error) {
    console.error('Error fetching calendars:', error);
    res.status(500).json({ error: 'Failed to fetch calendars' });
  }
});

// Check availability
router.post('/availability', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { startTime, endTime } = req.body;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Check for conflicts
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startTime,
      timeMax: endTime,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const conflicts = response.data.items || [];
    
    res.json({
      available: conflicts.length === 0,
      conflicts: conflicts.map(event => ({
        title: event.summary,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date
      }))
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

export default router;
