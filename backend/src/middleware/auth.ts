/**
 * ========================================
 * AUTHENTICATION MIDDLEWARE
 * ========================================
 * 
 * This file contains the "security guard" for our application.
 * Think of it as a bouncer at a club who checks IDs before letting people in.
 * 
 * WHAT IS MIDDLEWARE?
 * Middleware is code that runs BETWEEN receiving a request and sending a response.
 * It's like a checkpoint that every request must pass through.
 * 
 * WHAT IS JWT (JSON Web Token)?
 * JWT is like a digital ID card that proves who you are without needing to 
 * check a database every time. It contains your information in an encrypted format.
 */

// Import the tools we need
import express from 'express';  // Express types for TypeScript (tells TypeScript what req, res, next are)
import jwt from 'jsonwebtoken'; // JWT library for creating and verifying tokens

/**
 * ========================================
 * AUTHENTICATE TOKEN MIDDLEWARE FUNCTION
 * ========================================
 * 
 * This is our main "security guard" function.
 * It checks if the user has a valid "ID card" (JWT token) before allowing access.
 * 
 * HOW IT WORKS:
 * 1. Someone makes a request to a protected route
 * 2. This function runs BEFORE the route handler
 * 3. It checks for a valid token in the request
 * 4. If valid, it allows the request to continue
 * 5. If invalid, it stops the request and sends an error
 * 
 * PARAMETERS EXPLAINED:
 * - req: The incoming request (what the user sent us)
 * - res: The response object (how we send data back)
 * - next: A function that says "okay, move to the next step"
 */
export const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  
  /**
   * ========================================
   * STEP 1: EXTRACT THE TOKEN FROM THE REQUEST
   * ========================================
   * 
   * The token is sent in the "Authorization" header like this:
   * Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * 
   * We need to:
   * 1. Get the Authorization header
   * 2. Remove the "Bearer " part (it's just a prefix)
   * 3. Keep just the token part
   */
  
  // Get the Authorization header and remove "Bearer " prefix
  // The "?" means "if it exists" (optional chaining - won't crash if undefined)
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  /**
   * ========================================
   * STEP 2: CHECK IF TOKEN EXISTS
   * ========================================
   * 
   * If no token was provided, the user is trying to access protected content
   * without proper identification. We reject the request immediately.
   */
  if (!token) {
    // 401 = Unauthorized (you need to authenticate)
    return res.status(401).json({ error: 'No token provided' });
  }

  /**
   * ========================================
   * STEP 3: VERIFY THE TOKEN
   * ========================================
   * 
   * Now we check if the token is valid by:
   * 1. Trying to decrypt it using our secret key
   * 2. If successful, we get the user's information
   * 3. If it fails, the token is fake or expired
   * 
   * We use try-catch because jwt.verify() throws an error if the token is invalid
   */
  try {
    /**
     * JWT.VERIFY() EXPLAINED:
     * This function takes two parameters:
     * 1. token: The JWT token to verify
     * 2. secret: Our secret key (stored in environment variables)
     * 
     * If successful, it returns the decoded payload (user information)
     * If unsuccessful, it throws an error
     * 
     * The "!" after process.env.JWT_SECRET tells TypeScript "trust me, this exists"
     */
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    
    /**
     * ATTACH USER INFO TO REQUEST
     * We store the decoded user information on the request object
     * so that the next function (the actual route handler) can access it.
     * 
     * It's like putting a "VIP wristband" on the request that says
     * "this person is authenticated and here's their info"
     * 
     * The "(req as any)" is a TypeScript workaround because Express
     * doesn't know about our custom "user" property by default
     */
    (req as any).user = decoded;
    
    /**
     * CALL NEXT() TO CONTINUE
     * This tells Express "the security check passed, continue to the next step"
     * The next step is usually the actual route handler function
     * 
     * Think of it like a security guard saying "okay, you can go in now"
     */
    next();
    
  } catch (error) {
    /**
     * TOKEN VERIFICATION FAILED
     * If we reach this point, something was wrong with the token:
     * - It might be expired
     * - It might be fake/tampered with
     * - It might be signed with a different secret key
     * 
     * We reject the request and send an error
     */
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * ========================================
 * HOW THIS MIDDLEWARE IS USED
 * ========================================
 * 
 * In other files, you'll see this used like:
 * 
 * router.get('/protected-route', authenticateToken, (req, res) => {
 *   // This function only runs if authenticateToken passes
 *   const user = req.user; // The user info we attached above
 *   // ... handle the request
 * });
 * 
 * The flow is:
 * 1. User makes request to /protected-route
 * 2. authenticateToken runs first
 * 3. If token is valid, it calls next() and the route handler runs
 * 4. If token is invalid, it sends an error and stops
 */