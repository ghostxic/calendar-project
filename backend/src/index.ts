/**
 * ========================================
 * MAIN SERVER FILE - THE HEART OF OUR BACKEND
 * ========================================
 * 
 * This file is like the "main entrance" to our backend server.
 * Think of it like the front desk of a hotel - it receives all requests
 * and directs them to the right department (routes).
 */

// IMPORTS: Think of these as "tools" we need to build our server
// It's like gathering all the ingredients before cooking a meal

import express from 'express';        // Express.js - the web server framework (like a waiter that serves web pages)
import cors from 'cors';              // CORS - allows our frontend to talk to our backend (like a translator)
import dotenv from 'dotenv';          // Dotenv - reads secret settings from .env file (like a password manager)
import authRoutes from './routes/auth';      // Authentication routes - handles login/logout (like security guard)
import eventRoutes from './routes/events';  // Event routes - handles calendar events (like event planner)
import calendarRoutes from './routes/calendars'; // Calendar routes - manages calendars (like calendar manager)

/**
 * CONFIGURATION SETUP
 * This tells our app to read the .env file for secret settings like API keys
 * It's like opening your password manager at the start of the day
 */
dotenv.config();

/**
 * CREATE THE EXPRESS APPLICATION
 * Think of 'app' as creating a new restaurant that can serve customers
 * Express is the framework that makes it easy to build web servers in Node.js
 */
const app = express();

/**
 * SET THE PORT NUMBER
 * This is like choosing which "address" our server will live at
 * PORT is where our server will listen for requests (like a phone number)
 * If no PORT is set in environment variables, we default to 3001
 */
const PORT = process.env.PORT || 3001;

/**
 * ========================================
 * MIDDLEWARE SETUP
 * ========================================
 * 
 * Middleware functions are like security guards and assistants that process
 * every request before it reaches our main business logic.
 * Think of them as a series of checkpoints at an airport.
 */

/**
 * ALLOWED ORIGINS - WHO CAN TALK TO OUR SERVER
 * This is like a VIP guest list for a party
 * Only these websites are allowed to make requests to our server
 * This prevents random websites from attacking our API
 */
const allowedOrigins = [
  'http://localhost:5173',                    // Local development frontend (Vite default port)
  'http://localhost:5174',                    // Alternative local development port
  'https://ghostxic.github.io',               // Production frontend domain
  'https://ghostxic.github.io/calendar-project' // Specific production app path
];

/**
 * CORS MIDDLEWARE - CROSS-ORIGIN RESOURCE SHARING
 * 
 * CORS is like a security guard that decides which websites can talk to our server.
 * Without CORS, browsers block requests between different domains for security.
 * 
 * Think of it like this:
 * - Your frontend runs on localhost:5173
 * - Your backend runs on localhost:3001  
 * - These are different "origins" so browser blocks them by default
 * - CORS middleware gives permission for this communication
 */
app.use(cors({
  /**
   * ORIGIN CHECKER FUNCTION
   * This function runs for EVERY request to check if it's allowed
   * 
   * Parameters:
   * - origin: Where the request came from (like checking someone's ID)
   * - callback: Function to call with the decision (like saying "yes you can enter" or "no")
   */
  origin: (origin, callback) => {
    /**
     * ALLOW REQUESTS WITH NO ORIGIN
     * Some requests (like from mobile apps or server tools) don't have an origin
     * We allow these because they're usually safe
     */
    if (!origin) return callback(null, true);
    
    /**
     * CHECK IF ORIGIN IS IN OUR ALLOWED LIST
     * This is like checking if someone's name is on the VIP guest list
     */
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);  // callback(error, allowed) - null means no error, true means allowed
    } else {
      return callback(new Error('Not allowed by CORS')); // Reject the request with an error
    }
  },
  /**
   * CREDENTIALS: TRUE
   * This allows cookies and authentication headers to be sent with requests
   * It's like allowing guests to bring their ID cards to the party
   */
  credentials: true
}));

/**
 * JSON PARSER MIDDLEWARE
 * This middleware automatically converts JSON data from requests into JavaScript objects
 * 
 * Think of it like a translator that converts foreign language (JSON strings) 
 * into your native language (JavaScript objects) so you can understand them
 * 
 * Without this, req.body would be raw text instead of a nice object
 */
app.use(express.json());

/**
 * ========================================
 * ROUTES SETUP - THE DIFFERENT DEPARTMENTS
 * ========================================
 * 
 * Routes are like departments in a big company
 * Each department handles different types of requests
 * 
 * The app.use() function connects these departments to specific "addresses"
 */

/**
 * AUTHENTICATION ROUTES
 * Handles: /api/auth/google, /api/auth/google/callback, /api/auth/verify
 * This department manages user login and logout (like HR department)
 */
app.use('/api/auth', authRoutes);

/**
 * EVENT ROUTES  
 * Handles: /api/events, /api/events/process
 * This department manages calendar events (like event planning department)
 */
app.use('/api/events', eventRoutes);

/**
 * CALENDAR ROUTES
 * Handles: /api/calendars, /api/calendars/availability
 * This department manages calendar operations (like scheduling department)
 */
app.use('/api/calendars', calendarRoutes);

/**
 * ========================================
 * HEALTH CHECK ENDPOINT
 * ========================================
 * 
 * This is like a "pulse check" for our server
 * Other services can call this to see if our server is alive and working
 * It's like asking "Hey, are you still there?" and getting "Yes, I'm fine!" back
 */
app.get('/api/health', (req, res) => {
  /**
   * PARAMETERS EXPLAINED:
   * - req (request): Information about who asked and what they asked for
   * - res (response): Our way to send information back to them
   * 
   * We send back a simple JSON object with:
   * - status: 'OK' means everything is working
   * - timestamp: current time (so they know when we responded)
   */
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * ========================================
 * ERROR HANDLING MIDDLEWARE
 * ========================================
 * 
 * This is like a "safety net" that catches any errors that happen anywhere in our app
 * If something goes wrong and we don't handle it elsewhere, this catches it
 * 
 * Think of it like having a customer service representative who handles
 * complaints when other departments mess up
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  /**
   * PARAMETERS EXPLAINED:
   * - err: The error that happened (like a description of what went wrong)
   * - req: The request that caused the error
   * - res: Our way to send an error response back
   * - next: Function to pass control to the next middleware (we don't use it here)
   */
  
  // Log the error to the console so developers can see what went wrong
  console.error(err.stack);
  
  // Send a generic error message to the user (don't reveal sensitive error details)
  res.status(500).json({ error: 'Something went wrong!' });
});

/**
 * ========================================
 * START THE SERVER
 * ========================================
 * 
 * This is like opening the doors of our restaurant and saying "We're open for business!"
 * The server starts listening on the specified port for incoming requests
 */
app.listen(PORT, () => {
  /**
   * This callback function runs once the server successfully starts
   * It's like a confirmation message that everything is ready
   */
  console.log(`Server running on port ${PORT}`);
});
