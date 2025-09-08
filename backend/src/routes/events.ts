/**
 * ========================================
 * EVENTS ROUTES - THE EVENT MANAGEMENT SYSTEM
 * ========================================
 * 
 * This file handles everything related to calendar events:
 * - Fetching user's existing events from Google Calendar
 * - Creating new events in Google Calendar
 * - Processing natural language input to create events
 * - Checking NLP service status
 * 
 * Think of this as the "Event Planning Department" that:
 * 1. Shows you your schedule
 * 2. Adds new appointments to your calendar
 * 3. Understands when you say "meeting tomorrow at 2pm"
 * 4. Checks if you're free at that time
 */

// Import the tools we need
import express from 'express';                              // Web framework for handling HTTP requests
import { google } from 'googleapis';                       // Google's official library for Calendar API
import { processTextToEvent } from '../services/nlpService';        // AI service that converts text to event data
import { checkAvailability } from '../services/availabilityService'; // Service that checks calendar conflicts
import { authenticateToken } from '../middleware/auth';              // Security guard that checks user tokens

/**
 * CREATE THE ROUTER
 * This router handles all /api/events/* requests
 * It's like a receptionist for the Event Planning Department
 */
const router = express.Router();

/**
 * ========================================
 * GET USER'S EVENTS - SHOW ME MY SCHEDULE
 * ========================================
 * 
 * ROUTE: GET /api/events
 * PURPOSE: Fetches all upcoming events from the user's Google Calendar
 * SECURITY: Requires authentication token (user must be logged in)
 * 
 * This is like asking "What's on my schedule?" and getting back a list
 * of all your upcoming appointments, meetings, and events.
 * 
 * FLOW:
 * 1. Frontend: "Show me my events" → GET /api/events with auth token
 * 2. Backend: Checks if user is authenticated
 * 3. Backend: Uses user's Google tokens to access their calendar
 * 4. Backend: Asks Google for all upcoming events
 * 5. Backend: Sends event list back to frontend
 * 6. Frontend: Displays events in the UI
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    /**
     * GET USER INFO FROM JWT TOKEN
     * The authenticateToken middleware already verified the user's JWT token
     * and stored their information in req.user. This includes their Google
     * access tokens that we need to talk to Google Calendar on their behalf.
     */
    const user = (req as any).user;
    
    /**
     * SET UP GOOGLE CALENDAR CLIENT
     * We create a new OAuth2 client and give it the user's Google tokens.
     * This is like showing Google our "permission slip" to access this
     * specific user's calendar.
     */
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: user.accessToken,   // Short-term key for making API calls
      refresh_token: user.refreshToken  // Long-term key for getting new access tokens
    });

    /**
     * CREATE CALENDAR API CLIENT
     * This gives us access to all Google Calendar functions like:
     * - events.list() = get events
     * - events.insert() = create events  
     * - events.update() = modify events
     * - events.delete() = remove events
     */
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    /**
     * FETCH UPCOMING EVENTS
     * We ask Google for events with specific criteria:
     * 
     * - calendarId: 'primary' = user's main calendar (not shared calendars)
     * - timeMin: now = only future events (don't show past events)
     * - maxResults: 50 = limit to 50 events (don't overwhelm the UI)
     * - singleEvents: true = expand recurring events into individual instances
     * - orderBy: 'startTime' = sort by when events start (earliest first)
     */
    const response = await calendar.events.list({
      calendarId: 'primary',                    // Main calendar only
      timeMin: new Date().toISOString(),       // From now onwards
      maxResults: 50,                          // Maximum 50 events
      singleEvents: true,                      // Expand recurring events
      orderBy: 'startTime',                    // Sort by start time
    });

    /**
     * SEND EVENTS BACK TO FRONTEND
     * Google returns a complex response object, but we only need the 'items' array
     * which contains the actual events. If no events exist, we send an empty array.
     * 
     * Each event object contains:
     * - id: Google's unique identifier
     * - summary: Event title
     * - start/end: Date and time information
     * - location: Where the event takes place
     * - description: Additional event details
     */
    res.json(response.data.items || []);
    
  } catch (error: any) {
    /**
     * HANDLE ERRORS GRACEFULLY
     * Things that could go wrong:
     * - User's Google tokens expired
     * - Network connection issues
     * - Google API temporarily unavailable
     * - User revoked calendar permissions
     * 
     * We log the error for debugging and send a user-friendly message
     */
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * ========================================
 * CREATE NEW EVENT - ADD TO CALENDAR
 * ========================================
 * 
 * ROUTE: POST /api/events
 * PURPOSE: Creates a new event in the user's Google Calendar
 * SECURITY: Requires authentication token
 * 
 * This is like telling your assistant "Please add this appointment 
 * to my calendar" and having them write it down in your schedule book.
 * 
 * FLOW:
 * 1. Frontend: Sends event details (title, start, end, location, description)
 * 2. Backend: Validates user authentication
 * 3. Backend: Formats the event data for Google Calendar API
 * 4. Backend: Creates the event in user's Google Calendar
 * 5. Backend: Sends back the created event details
 * 6. Frontend: Shows success message and updates event list
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    /**
     * GET USER INFO AND EVENT DETAILS
     * - user: Contains Google tokens for API access
     * - req.body: Contains event details sent from frontend
     */
    const user = (req as any).user;
    const { title, start, end, description, location } = req.body;

    /**
     * SET UP GOOGLE OAUTH CLIENT
     * We need to create the full OAuth2 client with our app credentials
     * AND the user's tokens. This proves to Google that:
     * 1. We are a legitimate app (client ID/secret)
     * 2. We have permission from this specific user (access/refresh tokens)
     */
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,     // Our app's identity
      process.env.GOOGLE_CLIENT_SECRET, // Our app's password
      process.env.GOOGLE_REDIRECT_URI   // Where Google should redirect after auth
    );
    
    /**
     * ATTACH USER'S GOOGLE TOKENS
     * This is like putting the user's "permission slip" into our
     * credentials so Google knows we can act on their behalf
     */
    oauth2Client.setCredentials({
      access_token: user.accessToken,   // Current session key
      refresh_token: user.refreshToken  // Long-term renewal key
    });

    /**
     * CREATE CALENDAR API CLIENT
     * Now we can talk to Google Calendar on behalf of this user
     */
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    /**
     * FORMAT EVENT FOR GOOGLE CALENDAR API
     * Google expects events in a specific format. We convert our simple
     * event data into Google's required structure.
     * 
     * NOTE: We hardcode timezone to 'America/New_York' but in a production
     * app, you'd want to use the user's actual timezone.
     */
    const event = {
      summary: title,           // Event title (what Google calls "summary")
      description: description, // Event details/notes
      location: location,       // Where the event takes place
      start: {
        dateTime: start,                    // Start time in ISO format (2024-01-15T14:00:00Z)
        timeZone: 'America/New_York',      // Timezone for start time
      },
      end: {
        dateTime: end,                      // End time in ISO format
        timeZone: 'America/New_York',      // Timezone for end time
      },
    };

    /**
     * CREATE THE EVENT IN GOOGLE CALENDAR
     * This is the actual API call that adds the event to the user's calendar.
     * 
     * - calendarId: 'primary' = user's main calendar
     * - requestBody: the event object we formatted above
     */
    const response = await calendar.events.insert({
      calendarId: 'primary',    // Add to user's main calendar
      requestBody: event,       // The event data
    });
    
    /**
     * SEND BACK THE CREATED EVENT
     * Google returns the full event object with additional fields like:
     * - id: Google's unique identifier for this event
     * - htmlLink: Direct link to view the event in Google Calendar
     * - created: When the event was created
     * - updated: When the event was last modified
     */
    res.json(response.data);
    
  } catch (error: any) {
    /**
     * COMPREHENSIVE ERROR HANDLING
     * Things that could go wrong:
     * - Invalid event data (missing required fields)
     * - User's Google tokens expired
     * - Google API rate limits exceeded
     * - User doesn't have permission to create events
     * - Network connectivity issues
     */
    console.error('Error creating event:', error);
    
    /**
     * LOG GOOGLE-SPECIFIC ERRORS
     * If the error came from Google's API, log the detailed response
     * so developers can understand what went wrong
     */
    if (error.response) {
      console.error('Google API error response:', error.response.data);
    }
    
    /**
     * SEND DETAILED ERROR INFO TO FRONTEND
     * We send multiple pieces of error information:
     * - Generic error message for users
     * - Technical error details for debugging
     * - Google's specific error response if available
     */
    res.status(500).json({ 
      error: 'Failed to create event',      // User-friendly message
      details: error.message,               // Technical error details
      googleError: error.response?.data     // Google's error response (if any)
    });
  }
});

/**
 * ========================================
 * PROCESS NATURAL LANGUAGE - THE MAGIC HAPPENS HERE
 * ========================================
 * 
 * ROUTE: POST /api/events/process
 * PURPOSE: Converts natural language text into structured event data
 * SECURITY: Requires authentication token
 * 
 * This is the CORE FEATURE of our app! When users type:
 * "Gym session tomorrow for 2 hours at the arc gym"
 * 
 * This endpoint:
 * 1. Uses AI to understand what they mean
 * 2. Converts it to proper event data (title, start time, end time, location)
 * 3. Checks if they're free at that time
 * 4. Suggests alternative times if there are conflicts
 * 
 * FLOW:
 * 1. Frontend: User types natural language → sends to /process
 * 2. Backend: Uses NLP service to convert text to event data
 * 3. Backend: Checks user's calendar for conflicts
 * 4. Backend: Returns event data + availability info
 * 5. Frontend: Shows confirmation modal with conflict warnings
 * 6. User: Reviews and approves → creates actual event
 */
router.post('/process', authenticateToken, async (req, res) => {
  try {
    /**
     * EXTRACT INPUT DATA
     * - text: Natural language input ("gym session tomorrow for 2 hours")
     * - timezone: User's timezone (needed for correct time interpretation)
     */
    const { text, timezone } = req.body;
    
    /**
     * STEP 1: CONVERT TEXT TO EVENT DATA
     * This is where the magic happens! The NLP service uses AI
     * (OpenAI, Ollama, or smart fallback patterns) to convert:
     * 
     * "Gym session tomorrow for 2 hours at the arc gym"
     *        ↓
     * {
     *   title: "Gym Session",
     *   start: "2024-01-15T18:00:00.000Z",
     *   end: "2024-01-15T20:00:00.000Z", 
     *   location: "Arc Gym",
     *   description: "Gym session tomorrow for 2 hours at the arc gym"
     * }
     */
    const eventData = await processTextToEvent(text, timezone);
    
    /**
     * STEP 2: CHECK CALENDAR AVAILABILITY
     * Before we show the user their event, let's check if they're
     * actually free at that time. We need to set up Google Calendar
     * access first.
     */
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
    
    /**
     * CHECK FOR CONFLICTS
     * The availability service looks at the user's existing calendar
     * events and checks if the new event would overlap with anything.
     * 
     * Returns:
     * - isAvailable: true/false
     * - conflicts: array of conflicting events
     * - suggestedTimes: alternative times if conflicts exist
     */
    const availability = await checkAvailability(oauth2Client, eventData.start, eventData.end);
    
    /**
     * COMBINE RESULTS AND SEND BACK
     * We send back everything the frontend needs to show a
     * smart confirmation dialog:
     * - event: The processed event data
     * - confidence: How confident we are in the AI interpretation (0.8 = 80%)
     * - availability: Conflict information and suggestions
     */
    const response = { 
      event: eventData,         // Processed event data
      confidence: 0.8,          // AI confidence level
      availability: availability // Calendar conflict info
    };
    res.json(response);
    
  } catch (error: any) {
    /**
     * HANDLE PROCESSING ERRORS
     * Things that could go wrong:
     * - NLP service fails to parse the text
     * - Google Calendar API is unavailable
     * - User's tokens are expired
     * - Text is too ambiguous to understand
     */
    console.error('Error processing text:', error);
    res.status(500).json({ error: 'Failed to process text' });
  }
});

/**
 * ========================================
 * NLP SERVICE STATUS - DIAGNOSTIC ENDPOINT
 * ========================================
 * 
 * ROUTE: GET /api/events/nlp-status
 * PURPOSE: Reports which AI services are available for natural language processing
 * SECURITY: No authentication required (diagnostic endpoint)
 * 
 * This endpoint helps developers and users understand which AI services
 * are currently available for processing natural language input:
 * - OpenAI: Best accuracy (requires API key and costs money)
 * - Ollama: Good accuracy (requires local installation)
 * - Fallback: Basic pattern matching (always available)
 */
router.get('/nlp-status', (req, res) => {
  /**
   * CHECK OPENAI AVAILABILITY
   * OpenAI is available if we have an API key set in environment variables
   * This is the most accurate but requires payment per request
   */
  const openai = process.env.OPENAI_API_KEY ? true : false;
  
  /**
   * CHECK OLLAMA AVAILABILITY  
   * Ollama is only available in development (not production)
   * It requires a local installation of Ollama with models downloaded
   */
  const ollama = process.env.NODE_ENV !== 'production';
  
  /**
   * DETERMINE ACTIVE SERVICE
   * We use services in order of preference:
   * 1. OpenAI (best accuracy, requires API key)
   * 2. Ollama (good accuracy, works offline, development only)
   * 3. Fallback (basic regex patterns, always works)
   */
  const activeService = openai ? 'OpenAI' : (ollama ? 'Ollama' : 'Fallback');
  
  /**
   * RETURN STATUS REPORT
   * This information helps developers understand:
   * - What environment we're running in
   * - Which AI services are configured
   * - Which service will actually be used
   * - When this status was checked
   */
  res.json({
    environment: process.env.NODE_ENV,    // 'development' or 'production'
    openai_available: openai,             // true if API key is set
    ollama_available: ollama,             // true if in development
    fallback_available: true,             // always true (regex patterns)
    active_service: activeService,        // which service will be used
    timestamp: new Date().toISOString()   // when this check was made
  });
});

/**
 * EXPORT THE ROUTER
 * Makes this router available to be imported and used in the main server
 * The main server connects this to /api/events, so all routes become:
 * - GET /api/events (list events)
 * - POST /api/events (create event) 
 * - POST /api/events/process (process natural language)
 * - GET /api/events/nlp-status (check AI services)
 */
export default router;
