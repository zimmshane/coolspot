# CoolSpot

A location-centric social media platform for discovering and sharing interesting places within local communities. Features an interactive map interface where users can mark, describe, and discuss favorite locations across categories like study spaces, landmarks, and cafes.

## Prerequisites

Node.js (version not specified - testing recommended with latest LTS)
MongoDB instance
Google OAuth credentials
Quick Start

Install dependencies

```bash
./install.bash
```

## Configure environment variables
Create .env files in both frontend and backend directories:

```bash
# ./backend/back.env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MONGODB_URI=you_mondodb_uri
```

```bash
# ./frontend/.env
GOOGLE_CLIENT_ID=your_google_client_id
```

## Start application

```bash
# Backend
cd backend
node node.js

# Frontend
# In a seperate terminal
cd frontend
npm start
```
## Getting OAuth Credentials

Visit Google Cloud Console
Create/select project
Enable Google+ API
Create OAuth 2.0 client credentials
Add authorized redirect URIs for your local setup