# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Google account

## 5-Minute Setup

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### 2. Google Calendar API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Google Calendar API"
4. Create OAuth 2.0 credentials:
   - Application type: "Web application"  
   - Authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
5. Save Client ID and Client Secret

### 3. Configure Backend
```bash
cd backend
cp env.example .env
# Edit .env file with your Google credentials:

PORT=3001
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here  
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
JWT_SECRET=any_random_string_here
```

### 4. Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 5. Test the App
1. Open `http://localhost:5173`
2. Click "Sign in with Google"
3. Grant calendar permissions
4. Try: "Lunch meeting tomorrow at 1pm"
5. Check your Google Calendar!

## Need Help?
- See `COMPLETE_DEVELOPER_GUIDE.md` for detailed explanations
- Check troubleshooting section if something doesn't work
- Make sure both servers are running before testing