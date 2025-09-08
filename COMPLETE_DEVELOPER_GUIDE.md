# 🎓 Complete Developer Guide: Plaintext Calendar App

## 📚 Table of Contents
1. [What This App Does](#what-this-app-does)
2. [How to Run Locally](#how-to-run-locally)
3. [Complete Code Architecture](#complete-code-architecture)
4. [Step-by-Step Code Walkthrough](#step-by-step-code-walkthrough)
5. [Understanding Key Concepts](#understanding-key-concepts)
6. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🚀 What This App Does

Imagine you could just type "Gym session tomorrow for 2 hours at the arc gym" and it automatically gets added to your Google Calendar. That's exactly what this app does!

**The Magic Flow:**
1. **User types natural language** → "Meeting with John next Tuesday at 3pm"
2. **AI processes the text** → Understands it means a meeting on Tuesday, 3:00 PM - 4:00 PM
3. **App checks your calendar** → "You're free at that time!" or "You have a conflict"
4. **Creates the event** → Adds it to your real Google Calendar

---

## 🏃‍♂️ How to Run Locally

### Prerequisites (What You Need Installed)
```bash
# Check if you have these installed:
node --version    # Should be 18 or higher
npm --version     # Should come with Node.js
git --version     # For cloning the repository
```

If you don't have them:
- **Node.js**: Download from [nodejs.org](https://nodejs.org/)
- **Git**: Download from [git-scm.com](https://git-scm.com/)

### Step 1: Get the Code
```bash
# Clone this repository to your computer
git clone https://github.com/your-username/plaintext-calendar-mvp.git
cd plaintext-calendar-mvp
```

### Step 2: Set Up Google Calendar API

**Why do we need this?** 
The app needs permission to read and write to Google Calendar on behalf of users. It's like getting a business license to operate a calendar service.

1. **Go to Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com/)

2. **Create a New Project** (or select existing):
   - Click "Select a project" → "New Project"
   - Name: "Plaintext Calendar" 
   - Click "Create"

3. **Enable the Calendar API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click on it → Click "Enable"

4. **Create Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure consent screen first:
     - User Type: "External" 
     - App name: "Plaintext Calendar"
     - Add your email as test user
   - Application type: "Web application"
   - Name: "Plaintext Calendar Web Client"
   - Authorized redirect URIs: Add `http://localhost:3001/api/auth/google/callback`
   - Click "Create"

5. **Save Your Credentials**:
   - Copy the "Client ID" and "Client Secret" - you'll need these!

### Step 3: Set Up the Backend

```bash
# Navigate to backend folder
cd backend

# Install all the packages the backend needs
npm install

# Create environment file (this stores your secret keys)
cp env.example .env

# Edit the .env file with your credentials
# You can use any text editor like notepad, VS Code, etc.
nano .env  # or: code .env  # or: notepad .env
```

**Fill in your .env file:**
```bash
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# Google OAuth Configuration (from Step 2)
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# JWT Configuration (create a random secret)
JWT_SECRET=your_super_secret_random_string_here

# Optional: OpenAI for better natural language processing
OPENAI_API_KEY=your_openai_api_key_here_if_you_have_one
```

**How to create a good JWT_SECRET:**
```bash
# Option 1: Use Node.js to generate a random string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Just make up a long random string
# Example: myapp_super_secret_key_12345_abcdef
```

### Step 4: Set Up the Frontend

```bash
# Open a new terminal window/tab and navigate to frontend
cd ../frontend  # if you're in backend folder
# OR
cd frontend     # if you're in the root folder

# Install all the packages the frontend needs
npm install
```

### Step 5: Start Both Servers

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev

# You should see: "Server running on port 3001"
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev

# You should see something like: "Local: http://localhost:5173"
```

### Step 6: Test the App

1. Open your browser to `http://localhost:5173`
2. Click "Sign in with Google"
3. Grant permissions to the app
4. Try typing: "Lunch meeting tomorrow at 1pm for 2 hours"
5. Confirm the event and check your Google Calendar!

---

## 🏗️ Complete Code Architecture

Think of this app like a restaurant:

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (The Dining Room)               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   main.tsx      │  │    App.tsx      │  │ AuthCallback │ │
│  │ (Entry Point)   │  │ (Main Interface)│  │ (Login Page) │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│               React Components (What Users See)              │
└─────────────────────────────────────────────────────────────┘
                              │
                    HTTP Requests (Menu Orders)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (The Kitchen)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │    index.ts     │  │   middleware    │  │    routes    │ │
│  │ (Main Server)   │  │ (Security Guard)│  │ (Chefs)      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   services      │  │  Google APIs    │                   │
│  │ (Specialized    │  │ (Suppliers)     │                   │
│  │  Workers)       │  │                 │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### File Structure Explained

```
plaintext-calendar-mvp/
├── backend/                           # Server-side code (The Kitchen)
│   ├── src/
│   │   ├── index.ts                   # Main server file (Head Chef)
│   │   ├── middleware/
│   │   │   └── auth.ts               # Security guard (checks membership cards)
│   │   ├── routes/                   # Different departments
│   │   │   ├── auth.ts              # Login department (HR)
│   │   │   ├── events.ts            # Event department (Event Planner)
│   │   │   └── calendars.ts         # Calendar department (Scheduler)
│   │   └── services/                # Specialized workers
│   │       ├── nlpService.ts        # Language expert (translates text to events)
│   │       └── availabilityService.ts # Time checker (finds free slots)
│   ├── package.json                 # List of tools/ingredients needed
│   ├── env.example                  # Template for secret settings
│   └── tsconfig.json               # TypeScript configuration
├── frontend/                        # Client-side code (The Dining Room)
│   ├── src/
│   │   ├── main.tsx                 # App entry point (Front Door)
│   │   ├── App.tsx                  # Main interface (Main Dining Room)
│   │   ├── AuthCallback.tsx         # Login handler (Reception Desk)
│   │   └── styles/                  # How things look (Interior Design)
│   │       ├── App.css
│   │       └── index.css
│   ├── package.json                 # List of frontend tools needed
│   └── vite.config.ts              # Build tool configuration
└── README.md                        # Instructions (Menu Description)
```

---

## 🔍 Step-by-Step Code Walkthrough

### 1. User Visits the App

**File: `frontend/src/main.tsx`**
```tsx
// This is like the front door of a restaurant
// It sets up the basic structure and routing

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>  {/* Like a host who directs customers to tables */}
      <Routes>
        <Route path="/" element={<App />} />                    {/* Main dining room */}
        <Route path="/auth/callback" element={<AuthCallback />} /> {/* VIP room for login */}
      </Routes>
    </Router>
  </StrictMode>,
)
```

**What happens:**
- Browser loads the HTML page
- React takes over and creates the app
- Router determines which "page" to show based on the URL

### 2. Main App Interface

**File: `frontend/src/App.tsx`**
```tsx
function App() {
  // These are like the restaurant's current state
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // "Is the customer a member?"
  const [events, setEvents] = useState<Event[]>([]);              // "What events do they have?"
  const [inputText, setInputText] = useState('');                 // "What did they type?"

  // When the app first loads (like when customer walks in)
  useEffect(() => {
    checkBackendStatus();  // "Is the kitchen open?"
    
    const token = localStorage.getItem('authToken');  // "Do they have a membership card?"
    if (token) {
      setIsAuthenticated(true);  // "Yes, they're a member"
      fetchEvents();             // "Get their calendar events"
    }
  }, []);
```

**The Flow:**
1. **Check if user is logged in** → Look for membership card (JWT token) in localStorage
2. **If logged in** → Show main interface with event creation form
3. **If not logged in** → Show Google sign-in button

### 3. User Clicks "Sign in with Google"

**What happens in the browser:**
```tsx
const handleGoogleAuth = async () => {
  // Ask our backend: "Where should I send this user to log in with Google?"
  const response = await fetch(`${API_BASE_URL}/auth/google`);
  const data = await response.json();
  
  // Redirect user to Google's login page
  window.location.href = data.authUrl;
};
```

**What happens on the backend:**
```typescript
// File: backend/src/routes/auth.ts
router.get('/google', (req, res) => {
  // Create credentials to talk to Google
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,     // "Hi Google, this is our app"
    process.env.GOOGLE_CLIENT_SECRET, // "Here's our secret password"
    process.env.GOOGLE_REDIRECT_URI   // "Send users back here when done"
  );

  // What permissions are we asking for?
  const scopes = [
    'https://www.googleapis.com/auth/calendar',           // Access their calendar
    'https://www.googleapis.com/auth/userinfo.email',    // See their email
    'https://www.googleapis.com/auth/userinfo.profile'   // See their name
  ];

  // Create the special URL that takes them to Google
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',  // We want long-term access
    scope: scopes,           // The permissions above
    prompt: 'consent'        // Always show permission screen
  });

  // Send the URL back to the frontend
  res.json({ authUrl });
});
```

### 4. User Logs in with Google and Returns

**Google redirects back to:** `http://localhost:3001/api/auth/google/callback?code=abc123...`

**Backend handles this:**
```typescript
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;  // Get the special code from Google
  
  // Trade the code for real access tokens
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get user information from Google
  const { data: userInfo } = await oauth2.userinfo.get();

  // Create our own token (JWT) that contains:
  // - User info (name, email)
  // - Google's access tokens (so we can access their calendar later)
  const jwtToken = jwt.sign({
    userId: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    accessToken: tokens.access_token,    // Key to access Google Calendar
    refreshToken: tokens.refresh_token   // Key to get new access tokens
  }, process.env.JWT_SECRET!, { expiresIn: '7d' });

  // Send user back to frontend with their membership card
  const frontendUrl = `${process.env.FRONTEND_URL}/#/auth/callback?token=${jwtToken}`;
  res.redirect(frontendUrl);
});
```

### 5. Frontend Receives the Token

**File: `frontend/src/AuthCallback.tsx`**
```tsx
export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract the token from the URL
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    
    if (token) {
      // Store the membership card for future use
      localStorage.setItem('authToken', token);
      
      // Go back to main app
      navigate('/');
    }
  }, [navigate, location]);

  // Show a loading spinner while processing
  return <div>Authenticating...</div>;
}
```

### 6. User Creates an Event

**User types:** "Gym session tomorrow for 2 hours at the arc gym"

**Frontend sends this to backend:**
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  const token = localStorage.getItem('authToken');  // Get membership card
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const response = await fetch(`${API_BASE_URL}/events/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // Show membership card
    },
    body: JSON.stringify({ 
      text: inputText,      // "Gym session tomorrow for 2 hours at the arc gym"
      timezone: userTimezone // "America/New_York"
    })
  });
  
  const data = await response.json();
  // data contains the processed event and availability info
};
```

### 7. Backend Processes Natural Language

**File: `backend/src/routes/events.ts`**
```typescript
router.post('/process', authenticateToken, async (req, res) => {
  const { text, timezone } = req.body;
  
  // Step 1: Convert text to event data using AI
  const eventData = await processTextToEvent(text, timezone);
  // Result: { title: "Gym Session", start: "2024-01-15T18:00:00Z", end: "2024-01-15T20:00:00Z", location: "Arc Gym" }
  
  // Step 2: Check if the time slot is available
  const user = req.user;  // Get user info from JWT token
  const oauth2Client = new google.auth.OAuth2(/* credentials */);
  oauth2Client.setCredentials({
    access_token: user.accessToken,   // Use Google tokens from JWT
    refresh_token: user.refreshToken
  });
  
  const availability = await checkAvailability(oauth2Client, eventData.start, eventData.end);
  // Result: { isAvailable: true, conflicts: [] } or { isAvailable: false, conflicts: [...], suggestedTimes: [...] }
  
  // Send back the event info and availability
  res.json({
    event: eventData,
    confidence: 0.8,
    availability: availability
  });
});
```

### 8. NLP Service Converts Text to Event

**File: `backend/src/services/nlpService.ts`**
```typescript
export const processTextToEvent = async (text: string, userTimezone?: string) => {
  // Try different AI services in order of preference:
  
  // 1. OpenAI (if API key is available) - Most accurate
  if (openai) {
    const prompt = `Convert this text to JSON: "${text}"...`; // Detailed prompt
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });
    // Parse the JSON response
  }
  
  // 2. Ollama (if running locally) - Good for development
  else if (ollama) {
    const response = await ollama.generate({
      model: 'llama3',
      prompt: prompt
    });
    // Parse the response
  }
  
  // 3. Smart fallback (always works) - Basic pattern matching
  else {
    return createSmartFallback(text, userTimezone);
    // Uses regex patterns to extract:
    // - Title: "gym session" → "Gym Session"
    // - Time: "tomorrow" → next day, "2 hours" → duration
    // - Location: "at the arc gym" → "Arc Gym"
  }
};
```

### 9. Check Calendar Availability

**File: `backend/src/services/availabilityService.ts`**
```typescript
export const checkAvailability = async (oauth2Client, startTime, endTime) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  // Get all events in the requested time range
  const response = await calendar.events.list({
    calendarId: 'primary',  // User's main calendar
    timeMin: startTime,     // "2024-01-15T18:00:00Z"
    timeMax: endTime,       // "2024-01-15T20:00:00Z"
    singleEvents: true,
    orderBy: 'startTime'
  });

  const existingEvents = response.data.items || [];
  
  // Check for conflicts (overlapping events)
  const conflicts = existingEvents.filter(event => {
    // Complex logic to detect if events overlap
    return (eventStart < requestedEnd && eventEnd > requestedStart);
  });

  if (conflicts.length === 0) {
    return { isAvailable: true, conflicts: [] };
  } else {
    // Generate alternative time suggestions
    const suggestedTimes = generateSuggestedTimes(startTime, endTime, existingEvents);
    return {
      isAvailable: false,
      conflicts,
      suggestedTimes
    };
  }
};
```

### 10. User Confirms and Creates Event

**Frontend shows confirmation modal, user clicks "Create Event":**
```tsx
const handleConfirmEvent = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(pendingEvent)  // Event data from previous step
  });

  if (response.ok) {
    setShowConfirmation(false);
    fetchEvents(); // Refresh the events list
  }
};
```

**Backend creates the event in Google Calendar:**
```typescript
router.post('/', authenticateToken, async (req, res) => {
  const user = req.user;
  const { title, start, end, description, location } = req.body;

  const oauth2Client = new google.auth.OAuth2(/* credentials */);
  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  // Create the event in Google Calendar
  const event = {
    summary: title,
    description: description,
    location: location,
    start: { dateTime: start, timeZone: 'America/New_York' },
    end: { dateTime: end, timeZone: 'America/New_York' }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event
  });

  res.json(response.data);  // Send back the created event
});
```

---

## 🧠 Understanding Key Concepts

### What is React?
React is like a smart assistant that updates your web page automatically:
- **Components**: Reusable pieces of UI (like LEGO blocks)
- **State**: Information the app remembers (like "is user logged in?")
- **Props**: Information passed between components (like function parameters)
- **useEffect**: Code that runs when something changes (like "when page loads")

### What is Express.js?
Express is like a restaurant's ordering system:
- **Routes**: Different menu items (`GET /events`, `POST /auth/google`)
- **Middleware**: Quality checks before serving (authentication, CORS)
- **Request/Response**: Customer order and what they get back

### What is JWT (JSON Web Token)?
JWT is like a tamper-proof membership card:
```
Header.Payload.Signature
↓       ↓         ↓
Type   User Info  Tamper-proof seal
```
- Contains user information
- Can't be faked (cryptographically signed)
- Has expiration date
- No database lookup needed

### What is OAuth 2.0?
OAuth is like valet parking:
1. You give Google your car (account) and keys
2. Google gives you a claim ticket (authorization code)  
3. You give us the claim ticket
4. We trade it for temporary keys to your car (access tokens)
5. We can now park/retrieve your car (access calendar) without your main keys

### What is Google Calendar API?
It's like having a remote control for Google Calendar:
- **Read events**: `calendar.events.list()`
- **Create events**: `calendar.events.insert()`  
- **Update events**: `calendar.events.update()`
- **Delete events**: `calendar.events.delete()`

---

## 🔧 Troubleshooting Guide

### Problem: "Server running on port 3001" but can't access it

**Solution:**
```bash
# Check if something else is using port 3001
netstat -an | grep 3001  # Mac/Linux
netstat -an | findstr 3001  # Windows

# If port is busy, change it in backend/.env:
PORT=3002
```

### Problem: "OAuth callback error" or "Authentication failed"

**Check these:**
1. **Environment variables are correct**:
   ```bash
   cd backend
   cat .env  # Check if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are filled
   ```

2. **Google Console redirect URI matches**:
   - Go to Google Cloud Console → Credentials
   - Check that redirect URI is exactly: `http://localhost:3001/api/auth/google/callback`

3. **JWT_SECRET is set**:
   ```bash
   # Make sure JWT_SECRET in .env is not empty
   JWT_SECRET=your_random_string_here
   ```

### Problem: "CORS error" or "Access blocked"

**This usually means:**
- Frontend and backend URLs don't match
- Check `FRONTEND_URL` in backend/.env: `FRONTEND_URL=http://localhost:5173`
- Make sure both servers are running

### Problem: Events not showing up

**Check:**
1. **Google Calendar permissions**: Make sure you granted calendar access
2. **Token in localStorage**: Open browser dev tools → Application → Local Storage → check for 'authToken'
3. **Backend logs**: Look at backend terminal for error messages

### Problem: "Failed to fetch events" or "Network error"

**Solutions:**
```bash
# Check backend is running
curl http://localhost:3001/api/health
# Should return: {"status":"OK","timestamp":"..."}

# Check frontend can reach backend
# Open browser dev tools → Network tab → look for failed requests
```

### Problem: NLP not understanding text properly

**This happens because:**
1. **No OpenAI API key**: App falls back to basic pattern matching
2. **Ollama not running**: Local AI model isn't available
3. **Text is too complex**: Try simpler phrases like "meeting tomorrow at 2pm"

**Improve accuracy:**
- Get OpenAI API key from [platform.openai.com](https://platform.openai.com/)
- Add to backend/.env: `OPENAI_API_KEY=sk-...`
- Restart backend server

### Problem: Package installation fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json  # Mac/Linux
rmdir /s node_modules & del package-lock.json  # Windows
npm install
```

### Problem: TypeScript compilation errors

```bash
# Check TypeScript configuration
cd backend  # or frontend
npx tsc --noEmit  # Check for type errors without building

# Common fix: Make sure all packages are installed
npm install
```

---

## 🎯 What You've Learned

By running this app, you now understand:

1. **Full-Stack Development**: How frontend and backend work together
2. **OAuth 2.0 Authentication**: How apps securely access user data
3. **API Integration**: How to use external services (Google Calendar)  
4. **Natural Language Processing**: How AI converts text to structured data
5. **Modern JavaScript/TypeScript**: Async/await, promises, ES modules
6. **React Hooks**: useState, useEffect, component lifecycle
7. **Express.js**: Routes, middleware, error handling
8. **Environment Configuration**: Managing secrets and settings

**Next Steps:**
- Try modifying the NLP prompts to handle different event types
- Add new features like event deletion or editing
- Improve the UI with better styling
- Add support for recurring events
- Integrate with other calendar services

**Happy coding!** 🚀