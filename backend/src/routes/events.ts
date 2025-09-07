import express from 'express';
import { google } from 'googleapis';
import { processTextToEvent } from '../services/nlpService';
import { checkAvailability } from '../services/availabilityService';

const router = express.Router();

// Middleware to authenticate requests
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user's events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(response.data.items || []);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create a new event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, start, end, description, location } = req.body;

    console.log('Creating event with data:', { title, start, end, description, location });
    console.log('User tokens:', { accessToken: user.accessToken ? 'present' : 'missing', refreshToken: user.refreshToken ? 'present' : 'missing' });

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: title,
      description: description,
      location: location,
      start: {
        dateTime: start,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: end,
        timeZone: 'America/New_York',
      },
    };

    console.log('Sending event to Google Calendar:', event);
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    console.log('Event created successfully:', response.data);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error creating event:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Google API error response:', error.response.data);
    }
    res.status(500).json({ 
      error: 'Failed to create event',
      details: error.message,
      googleError: error.response?.data
    });
  }
});

// Process natural language input
router.post('/process', authenticateToken, async (req, res) => {
  try {
    console.log('Processing text request:', req.body);
    const { text } = req.body;
    console.log('Text to process:', text);
    
    const eventData = await processTextToEvent(text);
    console.log('Event data processed:', eventData);
    
    // Check availability
    const user = (req as any).user;
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken
    });
    
    const availability = await checkAvailability(oauth2Client, eventData.start, eventData.end);
    console.log('Availability check:', availability);
    
    const response = { 
      event: eventData, 
      confidence: 0.8,
      availability: availability
    };
    console.log('Sending response:', response);
    res.json(response);
  } catch (error: any) {
    console.error('Error processing text:', error);
    res.status(500).json({ error: 'Failed to process text' });
  }
});

// NLP service status check
router.get('/nlp-status', (req, res) => {
  const openai = process.env.OPENAI_API_KEY ? true : false;
  const ollama = process.env.NODE_ENV !== 'production';
  
  res.json({
    environment: process.env.NODE_ENV,
    openai_available: openai,
    ollama_available: ollama,
    fallback_available: true,
    active_service: openai ? 'OpenAI' : (ollama ? 'Ollama' : 'Fallback'),
    timestamp: new Date().toISOString()
  });
});

export default router;
