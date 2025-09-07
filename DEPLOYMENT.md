# GitHub Pages Deployment Guide

## Overview
This guide explains how to deploy the Plaintext Calendar project to GitHub Pages as a subdirectory of your main site.

## Prerequisites
1. Your main GitHub Pages site (`ghostxic.github.io`) is working
2. You have a backend server running (Railway, Heroku, etc.)

## Deployment Steps

### 1. Backend Deployment (Required)
Since GitHub Pages only serves static files, you need to deploy your backend separately:

**Option A: Railway (Recommended)**
1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub account
3. Deploy the `backend` folder
4. Get your Railway URL (e.g., `https://your-app.railway.app`)

**Option B: Heroku**
1. Create a new Heroku app
2. Deploy the backend folder
3. Get your Heroku URL

### 2. Update Frontend Configuration
1. Replace `https://your-backend-url.railway.app/api` in `frontend/src/App.tsx` with your actual backend URL
2. Update Google OAuth redirect URIs in Google Cloud Console to include your production domain

### 3. Deploy Frontend to GitHub Pages
The GitHub Actions workflow will automatically deploy when you push to main:

```bash
git add .
git commit -m "Configure for GitHub Pages deployment"
git push origin main
```

### 4. Enable GitHub Pages
1. Go to your repository settings
2. Navigate to "Pages" section
3. Set source to "GitHub Actions"
4. The site will be available at `https://ghostxic.github.io/calendar-project/`

## Manual Deployment (Alternative)
If you prefer manual deployment:

```bash
cd frontend
npm run deploy
```

## Environment Variables
Make sure your backend has these environment variables set:
- `FRONTEND_URL=https://ghostxic.github.io/calendar-project`
- `GOOGLE_REDIRECT_URI=https://your-backend-url.railway.app/api/auth/google/callback`
- All other existing variables

## Troubleshooting
- Check GitHub Actions logs if deployment fails
- Ensure backend URL is correct in frontend
- Verify Google OAuth redirect URIs include production domains
- Check browser console for API errors
