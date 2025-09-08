/**
 * ========================================
 * AUTHENTICATION ROUTES - THE LOGIN SYSTEM
 * ========================================
 * 
 * This file handles all the "login" and "logout" functionality for our app.
 * Think of this as the front desk at a hotel that manages check-ins and check-outs.
 * 
 * HOW GOOGLE OAUTH WORKS (Like explaining to a 5-year-old):
 * 1. User clicks "Sign in with Google"
 * 2. We send them to Google's login page
 * 3. User logs in with their Google account
 * 4. Google sends them back to us with a "permission slip"
 * 5. We trade that permission slip for special keys to access their calendar
 * 6. We give them a "membership card" (JWT token) to use our app
 */

// Import the tools we need for authentication
import express from 'express';      // Express router for handling web requests
import { google } from 'googleapis'; // Google's official library for talking to Google services
import jwt from 'jsonwebtoken';      // Library for creating secure tokens (digital membership cards)

/**
 * CREATE A ROUTER
 * A router is like a receptionist who handles different types of requests.
 * Instead of putting all our routes in the main server file, we organize
 * related routes together in their own file.
 */
const router = express.Router();

/**
 * ========================================
 * STEP 1: START THE LOGIN PROCESS
 * ========================================
 * 
 * ROUTE: GET /api/auth/google
 * PURPOSE: When user clicks "Sign in with Google", this creates a special URL
 *          that takes them to Google's login page.
 * 
 * Think of this like asking "Hey Google, can this user log in? Here's where
 * to send them back when they're done."
 */
router.get('/google', (req, res) => {
  /**
   * CREATE OAUTH2 CLIENT
   * This is like getting a "business license" to talk to Google on behalf of users.
   * We need to show Google our credentials (stored in environment variables):
   * - CLIENT_ID: Our app's unique identifier (like a business license number)
   * - CLIENT_SECRET: Our app's password (like a secret business code)
   * - REDIRECT_URI: Where Google should send users back after login
   */
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,     // "Hi Google, this is our app"
    process.env.GOOGLE_CLIENT_SECRET, // "Here's our secret password to prove it"
    process.env.GOOGLE_REDIRECT_URI   // "Send users back here when they're done logging in"
  );

  /**
   * DEFINE PERMISSIONS (SCOPES)
   * These are like asking for specific permissions:
   * - "Can we read/write to their calendar?"
   * - "Can we see their email address?"
   * - "Can we see their name and profile picture?"
   * 
   * Think of scopes like asking to borrow specific things from a friend.
   * We need to be specific about what we want to access.
   */
  const scopes = [
    'https://www.googleapis.com/auth/calendar',           // Permission to manage their calendar
    'https://www.googleapis.com/auth/userinfo.email',    // Permission to see their email
    'https://www.googleapis.com/auth/userinfo.profile'   // Permission to see their name and profile
  ];

  /**
   * GENERATE THE GOOGLE LOGIN URL
   * This creates a special URL that takes the user to Google's login page.
   * 
   * Parameters explained:
   * - access_type: 'offline' = we want a refresh token so we can access 
   *   their calendar even when they're not actively using our app
   * - scope: the permissions we're asking for (defined above)
   * - prompt: 'consent' = always show the permission screen (so they know what we're accessing)
   */
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',  // We want long-term access, not just while they're logged in
    scope: scopes,           // The permissions we defined above
    prompt: 'consent'        // Always show them what permissions we're requesting
  });

  /**
   * SEND THE URL BACK TO THE FRONTEND
   * The frontend will use this URL to redirect the user to Google's login page.
   * It's like giving someone directions to the DMV.
   */
  res.json({ authUrl });
});

/**
 * ========================================
 * STEP 2: HANDLE THE LOGIN RESULT
 * ========================================
 * 
 * ROUTE: GET /api/auth/google/callback
 * PURPOSE: After user logs in with Google, Google sends them back here
 *          with a special "authorization code". We trade this code for
 *          the actual keys to access their Google account.
 * 
 * This is like when someone comes back from the DMV with their completed
 * paperwork, and we need to process it to give them their membership card.
 */
router.get('/google/callback', async (req, res) => {
  /**
   * TRY-CATCH BLOCK
   * We wrap this in try-catch because many things can go wrong:
   * - Google might not send us a code
   * - The code might be expired or invalid
   * - Network requests might fail
   * 
   * Try-catch is like having a safety net - if anything goes wrong,
   * we can handle it gracefully instead of crashing.
   */
  try {
    /**
     * EXTRACT THE AUTHORIZATION CODE
     * When Google sends the user back to us, they include a special "code"
     * in the URL. This code is like a temporary ticket that we can exchange
     * for the real keys to their account.
     * 
     * req.query contains all the parameters from the URL
     * For example: /callback?code=abc123&state=xyz
     * req.query would be: { code: 'abc123', state: 'xyz' }
     */
    const { code } = req.query;

    /**
     * CHECK IF WE RECEIVED A CODE
     * If there's no code, something went wrong with the Google login process.
     * Maybe the user cancelled, or there was an error.
     * We return a 400 (Bad Request) error.
     */
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    /**
     * CREATE OAUTH2 CLIENT (AGAIN)
     * We need to create the same OAuth2 client as before to communicate with Google.
     * This is like showing our business credentials again when we come to trade
     * the temporary ticket for the real keys.
     */
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    /**
     * EXCHANGE CODE FOR TOKENS
     * This is the crucial step! We trade the temporary "authorization code"
     * for the real tokens that let us access the user's Google account.
     * 
     * We get back two types of tokens:
     * 1. access_token: Short-lived key for making API requests (like a day pass)
     * 2. refresh_token: Long-lived key for getting new access tokens (like a membership card)
     * 
     * The 'await' keyword means "wait for this to complete before continuing"
     * because this is a network request to Google's servers.
     */
    const { tokens } = await oauth2Client.getToken(code as string);
    
    /**
     * STORE THE TOKENS IN OUR CLIENT
     * We tell our OAuth2 client to remember these tokens so it can use them
     * for making requests to Google on behalf of this user.
     */
    oauth2Client.setCredentials(tokens);

    /**
     * GET USER INFORMATION FROM GOOGLE
     * Now that we have permission, let's ask Google for basic info about the user:
     * their name, email, and profile picture. This is like asking for their
     * business card now that they've given us permission to know who they are.
     */
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    /**
     * CREATE OUR OWN TOKEN (JWT)
     * Google's tokens are great for talking to Google, but for our own app,
     * we create our own "membership card" called a JWT (JSON Web Token).
     * 
     * This JWT contains:
     * - User's basic info (id, email, name)
     * - Google's access tokens (so we can make calendar requests later)
     * - An expiration date (7 days)
     * 
     * Think of JWT like a tamper-proof ID card that says:
     * "This person is authorized to use our app, and here's their info"
     */
    const jwtToken = jwt.sign(
      { 
        // User's basic information from Google
        userId: userInfo.id,           // Google's unique ID for this user
        email: userInfo.email,         // User's email address
        name: userInfo.name,           // User's display name
        
        // Google's tokens (we store these so we can access their calendar later)
        accessToken: tokens.access_token,   // Short-term key for Google API
        refreshToken: tokens.refresh_token  // Long-term key for getting new access tokens
      },
      process.env.JWT_SECRET!,  // Our secret key for signing the token (makes it tamper-proof)
      { expiresIn: '7d' }       // Token expires in 7 days (user will need to log in again)
    );

    /**
     * REDIRECT USER BACK TO OUR FRONTEND
     * Now we need to send the user back to our app's main page, but we also
     * need to give them their "membership card" (JWT token).
     * 
     * We do this by redirecting them to a special page on our frontend that
     * will extract the token from the URL and store it for future use.
     * 
     * We check if we're in production (deployed) or development (local) mode
     * and use the appropriate frontend URL.
     */
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? `https://ghostxic.github.io/calendar-project/#/auth/callback?token=${jwtToken}`  // Production URL
      : `${process.env.FRONTEND_URL}/#/auth/callback?token=${jwtToken}`;                 // Development URL
    
    /**
     * PERFORM THE REDIRECT
     * This sends the user's browser to our frontend with their new token.
     * The frontend will extract the token and store it for future API requests.
     */
    res.redirect(frontendUrl);

  } catch (error) {
    /**
     * HANDLE ERRORS GRACEFULLY
     * If anything went wrong in the process above (network error, invalid code,
     * expired tokens, etc.), we log the error for debugging and send a
     * friendly error message back to the user.
     */
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * ========================================
 * STEP 3: VERIFY TOKEN (OPTIONAL ENDPOINT)
 * ========================================
 * 
 * ROUTE: GET /api/auth/verify
 * PURPOSE: This is a utility endpoint that lets us check if a JWT token is valid.
 *          It's like a security guard checking if someone's membership card is real.
 * 
 * This endpoint is optional - we could do token verification directly in our
 * middleware, but having a separate endpoint is useful for debugging and
 * for frontend apps that want to check token validity.
 */
router.get('/verify', (req, res) => {
  /**
   * EXTRACT TOKEN FROM REQUEST HEADERS
   * The frontend sends the JWT token in the "Authorization" header like this:
   * Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * 
   * We need to remove the "Bearer " prefix and keep just the token part.
   */
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  /**
   * CHECK IF TOKEN EXISTS
   * If no token was provided, we can't verify anything, so we return an error.
   */
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  /**
   * VERIFY THE TOKEN
   * We use the same secret key that we used to create the token to verify it.
   * If the token is valid, we get back the original data we stored in it.
   * If it's invalid (fake, expired, or tampered with), jwt.verify() throws an error.
   */
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    
    /**
     * RETURN SUCCESS RESPONSE
     * If we reach this point, the token is valid! We send back a success
     * response along with the user information stored in the token.
     */
    res.json({ valid: true, user: decoded });
    
  } catch (error) {
    /**
     * HANDLE INVALID TOKENS
     * If jwt.verify() threw an error, the token is invalid (expired, fake, etc.)
     * We return a 401 Unauthorized error.
     */
    res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * EXPORT THE ROUTER
 * This makes our router available to be imported and used in other files.
 * The main server file (index.ts) imports this and connects it to the
 * /api/auth path, so:
 * - router.get('/google') becomes /api/auth/google
 * - router.get('/google/callback') becomes /api/auth/google/callback
 * - router.get('/verify') becomes /api/auth/verify
 */
export default router;

/**
 * ========================================
 * COMPLETE AUTHENTICATION FLOW SUMMARY
 * ========================================
 * 
 * 1. User clicks "Sign in with Google" on frontend
 * 2. Frontend calls GET /api/auth/google
 * 3. Backend creates Google OAuth URL and sends it back
 * 4. Frontend redirects user to Google's login page
 * 5. User logs in with Google and grants permissions
 * 6. Google redirects user to GET /api/auth/google/callback with authorization code
 * 7. Backend exchanges code for Google tokens and user info
 * 8. Backend creates JWT token containing user info and Google tokens
 * 9. Backend redirects user to frontend with JWT token in URL
 * 10. Frontend extracts JWT token and stores it for future API requests
 * 11. For all future API requests, frontend sends JWT token in Authorization header
 * 12. Backend middleware verifies JWT token before allowing access to protected routes
 */
