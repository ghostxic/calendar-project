# Plaintext to Calendar Event MVP

A web application that converts natural language (text/audio) into Google Calendar events through conversational AI.

## Features

- Google OAuth authentication
- Natural language processing for event creation
- Google Calendar integration
- Real-time availability checking
- Event management and confirmation workflow

## Tech Stack

### Frontend
- React + TypeScript + Vite
- Tailwind CSS
- Web Speech API

### Backend
- Node.js + Express + TypeScript
- Google Calendar API v3
- JWT authentication

## Getting Started

### Prerequisites
- Node.js 18+
- Google Cloud Console project with Calendar API enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ghostxic/calendar-project.git
cd calendar-project
```

2. Set up the backend:
```bash
cd backend
npm install
cp env.example .env
# Configure your environment variables
npm run dev
```

3. Set up the frontend:
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the backend directory with:

```
PORT=3001
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
JWT_SECRET=your_jwt_secret
GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key
```

## Development

- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:3001`

## License

MIT
