# 📁 Codebase File Overview & Architecture

## 🏗️ Architecture Overview

This is a **full-stack TypeScript application** with a **React frontend** and **Express.js backend** that integrates with **Google Calendar API** and uses **AI for natural language processing**.

```
┌─────────────────────────────────────────┐    ┌─────────────────────────────────────────┐
│              FRONTEND                   │    │               BACKEND                   │
│           (React/Vite)                  │    │            (Express.js)                 │
│                                         │    │                                         │
│  User Interface ←→ Google OAuth         │◄──►│  API Routes ←→ Google Calendar API      │
│  Event Display  ←→ Natural Language     │    │  Authentication ←→ AI/NLP Services      │
└─────────────────────────────────────────┘    └─────────────────────────────────────────┘
```

---

## 🎨 FRONTEND FILES

### Core Application Files

#### 📄 `frontend/src/main.tsx`
**Technology**: React 19, React Router, TypeScript  
**Purpose**: Application entry point and routing setup  
**Key Features**:
- Creates the root React application
- Sets up HashRouter for GitHub Pages compatibility
- Defines app routes: `/` (main app) and `/auth/callback` (OAuth handler)
- Renders the app in React StrictMode for better development experience

**Works with**:
- Loads `App.tsx` for main interface
- Loads `AuthCallback.tsx` for OAuth flow
- Uses `index.css` for global styling

---

#### 📄 `frontend/src/App.tsx`
**Technology**: React Hooks (useState, useEffect), TypeScript, Google OAuth  
**Purpose**: Main application interface and state management  
**Key Features**:
- **Authentication State**: Manages login/logout status
- **Event Management**: Displays user's calendar events
- **Natural Language Input**: Text area for event creation
- **Event Confirmation**: Modal for reviewing AI-processed events
- **Backend Communication**: API calls to Express server
- **Responsive UI**: Two-column layout with event form and event list

**Key State Variables**:
```typescript
const [isAuthenticated, setIsAuthenticated] = useState(false);     // Login status
const [events, setEvents] = useState<Event[]>([]);                // User's events
const [inputText, setInputText] = useState('');                   // NLP input
const [pendingEvent, setPendingEvent] = useState<any>(null);      // Event to confirm
const [showConfirmation, setShowConfirmation] = useState(false);  // Modal visibility
```

**API Integration**:
- `GET /api/auth/google` - Start OAuth flow
- `GET /api/events` - Fetch user's calendar events  
- `POST /api/events/process` - Process natural language
- `POST /api/events` - Create confirmed events

**Works with**:
- Calls backend API endpoints
- Uses `AuthCallback.tsx` for OAuth completion
- Styled by `App.css`

---

#### 📄 `frontend/src/AuthCallback.tsx`
**Technology**: React Hooks, React Router, localStorage  
**Purpose**: Handles Google OAuth callback and token extraction  
**Key Features**:
- **Token Extraction**: Parses JWT token from URL parameters
- **Local Storage**: Saves auth token for future API calls  
- **Auto-redirect**: Returns user to main app after auth
- **Loading UI**: Shows authentication progress

**OAuth Flow**:
1. User completes Google login
2. Google redirects to `/auth/callback?token=...`
3. Component extracts token from URL
4. Stores token in `localStorage.setItem('authToken', token)`
5. Redirects to main app at `/`

**Works with**:
- Receives redirect from Google OAuth
- Stores token for `App.tsx` to use
- Backend generates the token via `/api/auth/google/callback`

---

### Styling & Configuration

#### 📄 `frontend/src/styles/App.css`
**Technology**: CSS3, Flexbox, CSS Grid  
**Purpose**: Application styling and responsive design  
**Key Features**:
- **Authentication UI**: Login page and Google sign-in button
- **Main Layout**: Two-column responsive design
- **Event Components**: Event list items and confirmation modal
- **Modal System**: Overlay and confirmation dialog styles
- **Responsive Design**: Mobile-friendly layouts

**Design System**:
- Color palette: Blues and grays for professional look
- Typography: Clean, readable fonts
- Components: Card-based design with shadows
- Interactive: Hover effects and button states

---

#### 📄 `frontend/src/styles/index.css`
**Technology**: CSS3 Global Styles  
**Purpose**: Global styles and CSS resets  
**Key Features**:
- CSS reset and normalization
- Global font family settings
- Box-sizing for all elements

---

### Configuration Files

#### 📄 `frontend/package.json`
**Technology**: npm, Vite build system  
**Purpose**: Frontend dependencies and build scripts  
**Key Dependencies**:
- `react` + `react-dom`: UI framework
- `react-router-dom`: Client-side routing
- `typescript`: Type safety
- `vite`: Build tool and dev server
- `eslint`: Code linting

**Scripts**:
- `npm run dev`: Development server
- `npm run build`: Production build
- `npm run preview`: Preview production build

---

#### 📄 `frontend/vite.config.ts`
**Technology**: Vite, React Plugin  
**Purpose**: Build tool configuration  
**Key Features**:
- React plugin integration
- TypeScript support
- Development server setup

---

---

## 🔧 BACKEND FILES

### Core Server Files

#### 📄 `backend/src/index.ts`
**Technology**: Express.js, CORS, TypeScript  
**Purpose**: Main server setup and configuration  
**Key Features**:
- **Express Server**: Creates and configures web server
- **CORS Setup**: Allows frontend-backend communication
- **Route Integration**: Connects all API route modules
- **Middleware Stack**: JSON parsing, error handling
- **Health Check**: Server status endpoint

**Server Configuration**:
```typescript
const PORT = process.env.PORT || 3001;                    // Server port
const allowedOrigins = ['http://localhost:5173', ...];    // CORS whitelist
```

**Route Mounting**:
- `/api/auth/*` → `routes/auth.ts`
- `/api/events/*` → `routes/events.ts` 
- `/api/calendars/*` → `routes/calendars.ts`

**Works with**:
- All route modules for API endpoints
- Middleware for authentication and error handling
- Frontend via HTTP API calls

---

### Authentication System

#### 📄 `backend/src/middleware/auth.ts`
**Technology**: JWT, Express Middleware  
**Purpose**: Authentication middleware for protected routes  
**Key Features**:
- **JWT Verification**: Validates user tokens
- **Request Enhancement**: Adds user data to requests
- **Security**: Protects sensitive endpoints
- **Error Handling**: Graceful auth failure responses

**Authentication Flow**:
```typescript
1. Extract token from Authorization header: "Bearer <token>"
2. Verify token using JWT secret key
3. Decode user information from token
4. Attach user data to request object
5. Call next() to continue to route handler
```

**Works with**:
- Used by all protected routes (`authenticateToken` parameter)
- JWT tokens created by `routes/auth.ts`
- User data accessed by route handlers

---

#### 📄 `backend/src/routes/auth.ts`
**Technology**: Google OAuth 2.0, JWT, Express Router  
**Purpose**: Handles user authentication with Google  
**Key Features**:
- **OAuth Flow**: Complete Google OAuth 2.0 implementation
- **JWT Creation**: Generates app-specific tokens
- **Token Verification**: Validates existing tokens
- **User Info**: Retrieves Google profile data

**API Endpoints**:
- `GET /api/auth/google` - Start OAuth (returns Google login URL)
- `GET /api/auth/google/callback` - Handle OAuth return (creates JWT)
- `GET /api/auth/verify` - Verify JWT token validity

**OAuth Process**:
1. Generate Google OAuth URL with required scopes
2. User logs in with Google and grants permissions
3. Google redirects back with authorization code
4. Exchange code for Google access/refresh tokens
5. Get user profile information from Google
6. Create JWT containing user info + Google tokens
7. Redirect user to frontend with JWT token

**Works with**:
- Google OAuth 2.0 service
- Frontend OAuth flow
- Protected routes via middleware
- Google Calendar API (provides tokens)

---

### API Route Modules

#### 📄 `backend/src/routes/events.ts`
**Technology**: Google Calendar API v3, Express Router, AI Integration  
**Purpose**: Manages calendar events and natural language processing  
**Key Features**:
- **Event Retrieval**: Fetch user's Google Calendar events
- **Event Creation**: Add new events to Google Calendar
- **Natural Language Processing**: Convert text to structured events
- **Availability Checking**: Detect calendar conflicts
- **AI Service Status**: Report which NLP services are available

**API Endpoints**:
- `GET /api/events` - List user's upcoming events
- `POST /api/events` - Create new calendar event
- `POST /api/events/process` - Process natural language input
- `GET /api/events/nlp-status` - Check AI service availability

**Natural Language Flow**:
1. Receive text: "Gym session tomorrow for 2 hours"
2. Call NLP service to parse text into event data
3. Check calendar for conflicts using availability service
4. Return event data + availability info
5. Frontend shows confirmation modal
6. User approves → create actual calendar event

**Works with**:
- `services/nlpService.ts` for text processing
- `services/availabilityService.ts` for conflict checking
- Google Calendar API for event operations
- Authentication middleware for security

---

#### 📄 `backend/src/routes/calendars.ts`
**Technology**: Google Calendar API v3, Express Router  
**Purpose**: Calendar management and availability checking  
**Key Features**:
- **Calendar List**: Get user's available calendars
- **Availability API**: Direct availability checking endpoint
- **Multi-calendar Support**: Work with different calendar types

**API Endpoints**:
- `GET /api/calendars` - List user's calendars
- `POST /api/calendars/availability` - Check time slot availability

**Works with**:
- Google Calendar API for calendar operations
- Authentication middleware for security
- Events routes for integrated availability checking

---

### AI & Utility Services

#### 📄 `backend/src/services/nlpService.ts`
**Technology**: OpenAI GPT-3.5, Ollama, Regex Pattern Matching  
**Purpose**: Converts natural language to structured event data  
**Key Features**:
- **Multi-AI Support**: OpenAI (production) → Ollama (local) → Fallback (regex)
- **Smart Parsing**: Understands dates, times, durations, locations
- **Timezone Handling**: Respects user's timezone for accurate parsing
- **Fallback System**: Always works even without AI services

**AI Service Priority**:
1. **OpenAI** (Best accuracy, requires API key, costs money)
2. **Ollama** (Good accuracy, free, requires local installation)
3. **Smart Fallback** (Basic regex patterns, always available)

**Text Processing Examples**:
```
"Gym session tomorrow for 2 hours at the arc gym"
        ↓ (NLP Processing)
{
  title: "Gym Session",
  start: "2024-01-15T18:00:00.000Z",
  end: "2024-01-15T20:00:00.000Z",
  location: "Arc Gym",
  description: "Gym session tomorrow for 2 hours at the arc gym"
}
```

**Fallback Patterns**:
- Title extraction: Identifies event names
- Time parsing: "3pm", "tomorrow", "2 hours"
- Location detection: "at the gym", "in the office"
- Duration calculation: "for 2 hours", "30 minutes"

**Works with**:
- Called by `routes/events.ts` for text processing
- OpenAI API (if configured)
- Ollama local installation (if available)
- Always provides fallback processing

---

#### 📄 `backend/src/services/availabilityService.ts`
**Technology**: Google Calendar API v3, Date/Time Manipulation  
**Purpose**: Calendar conflict detection and alternative time suggestions  
**Key Features**:
- **Conflict Detection**: Finds overlapping calendar events
- **Time Suggestions**: Generates alternative available times
- **Smart Scheduling**: Considers work hours (9 AM - 5 PM)
- **Multi-day Support**: Can suggest next day if same day unavailable

**Availability Response Format**:
```typescript
{
  isAvailable: boolean,           // true if time slot is free
  conflicts: Event[],             // array of conflicting events
  suggestedTimes?: string[]       // alternative time suggestions
}
```

**Conflict Detection Logic**:
- Fetches existing events in requested time range
- Checks for time overlaps using date mathematics
- Considers both all-day and timed events
- Returns detailed conflict information

**Time Suggestion Algorithm**:
- Try same day at different hours (9 AM, 11 AM, 1 PM, 3 PM, 5 PM)
- Maintain original event duration
- Skip times that conflict with existing events
- Fall back to next day at 9 AM if no same-day options

**Works with**:
- Called by `routes/events.ts` during event processing
- Google Calendar API for fetching existing events
- Returns data used by frontend confirmation modal

---

### Configuration Files

#### 📄 `backend/package.json`
**Technology**: npm, Node.js, TypeScript  
**Purpose**: Backend dependencies and scripts  
**Key Dependencies**:
- `express`: Web framework
- `googleapis`: Google API client
- `jsonwebtoken`: JWT token handling
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment variable management
- `openai`: OpenAI API client
- `ollama`: Local AI model client
- `typescript` + `ts-node`: TypeScript support

**Scripts**:
- `npm run dev`: Development server with hot reload
- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run production build

---

#### 📄 `backend/env.example`
**Technology**: Environment Variables, dotenv  
**Purpose**: Template for required configuration  
**Key Variables**:
- `PORT`: Server port (default 3001)
- `FRONTEND_URL`: Frontend URL for CORS
- `GOOGLE_CLIENT_ID`: Google OAuth app ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth app secret
- `GOOGLE_REDIRECT_URI`: OAuth callback URL
- `JWT_SECRET`: Secret for signing JWT tokens
- `OPENAI_API_KEY`: OpenAI API key (optional)

**Security**: Contains sensitive configuration that must be kept secret

---

#### 📄 `backend/tsconfig.json`
**Technology**: TypeScript Compiler Configuration  
**Purpose**: TypeScript compilation settings  
**Key Features**:
- ES2020 target for modern Node.js
- CommonJS modules for Node.js compatibility
- Strict type checking enabled
- Source maps for debugging
- Output directory: `./dist`

---

## 🔗 Inter-File Communication Flow

### Complete User Journey Through the Codebase

```
1. USER LOADS APP
   frontend/main.tsx → frontend/App.tsx
   ↓
   App checks localStorage for authToken
   ↓
   If no token: Show login UI

2. USER CLICKS "SIGN IN WITH GOOGLE"
   frontend/App.tsx → backend/routes/auth.ts (/auth/google)
   ↓
   backend creates Google OAuth URL
   ↓
   frontend redirects to Google login

3. USER COMPLETES GOOGLE LOGIN
   Google → backend/routes/auth.ts (/auth/google/callback)
   ↓
   backend exchanges code for tokens, creates JWT
   ↓
   backend redirects to frontend/AuthCallback.tsx
   ↓
   AuthCallback extracts token, stores in localStorage
   ↓
   Redirects back to frontend/App.tsx

4. USER TYPES NATURAL LANGUAGE
   frontend/App.tsx → backend/routes/events.ts (/events/process)
   ↓
   backend/services/nlpService.ts processes text
   ↓
   backend/services/availabilityService.ts checks conflicts
   ↓
   backend returns event data + availability info
   ↓
   frontend shows confirmation modal

5. USER CONFIRMS EVENT
   frontend/App.tsx → backend/routes/events.ts (/events)
   ↓
   backend creates event in Google Calendar
   ↓
   frontend refreshes event list and closes modal
```

### Technology Stack Integration

**Frontend Stack**:
- React 19 + TypeScript for UI components
- React Router for navigation
- Vite for build tooling and development
- CSS3 for styling and responsive design

**Backend Stack**:
- Express.js + TypeScript for API server
- Google OAuth 2.0 for authentication
- JWT for session management
- Google Calendar API v3 for calendar operations
- OpenAI/Ollama for natural language processing

**External Services**:
- Google Calendar API: Event storage and retrieval
- Google OAuth 2.0: User authentication
- OpenAI API: Advanced text processing (optional)
- Ollama: Local AI processing (development)

This architecture creates a seamless flow from natural language input to calendar events, with robust authentication, intelligent conflict detection, and fallback systems for reliability.