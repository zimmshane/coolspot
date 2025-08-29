#!/bin/bash
set -e  # Exit on any error

echo "Installing webapp dependencies..."

# Backend setup
echo "Setting up backend..."
cd backend
npm install express cookie-parser cors crypto path express-rate-limit express-validator mongodb google-auth-library helmet jsdom dompurify validator
cat > back.env << 'EOF'
MONGODB_URI=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
PORT=3001
DB_NAME=
EOF
echo "Created back.env template"

# Frontend setup  
echo "Setting up frontend..."
cd ../frontend
npm install react @react-oauth/google react-leaflet leaflet 
cat > .env << 'EOF'
REACT_APP_GOOGLE_CLIENT_ID=
REACT_APP_API_BASE_URL=http://localhost:3001
REACT_APP_NODE_ENV=development
EOF
echo "Created .env template"

cd ..
echo "Installation complete. Edit environment files with your secrets."
