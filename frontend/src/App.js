import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import React, { useState } from 'react';

function App() {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [type, setType] = useState('general');
  const [message, setMessage] = useState('');

  console.log('Google Client ID loaded:', googleClientId ? 'Yes' : 'No');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: credentialResponse.credential })
      });

      const data = await response.json();
      if (data.success) {
        console.log('User logged in:', data.user);
        setLoggedIn(true);
        setMessage('Logged in!');
      }
      else {
        setMessage('Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setMessage('Login failed');
    }
  };



    const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    // Parse to float and limit to 7 decimal places for accuracy
    const latitude = parseFloat(Number(lat).toFixed(7));
    const longitude = parseFloat(Number(lng).toFixed(7));
    try {
      const response = await fetch(`${apiBaseUrl}/api/spots`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
         body: JSON.stringify({
          name,
          coordinates: [longitude, latitude], // longitude first!
          type
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Location added!');
        setName('');
        setLat('');
        setLng('');
        setType('general');
      } else {
        setMessage(data.error || 'Failed to add location');
      }
    } catch (err) {
      setMessage('Error connecting to server');
    }
  };



  if (!googleClientId) {
    console.error('REACT_APP_GOOGLE_CLIENT_ID not found in environment variables');
    return <div>Configuration error: Missing Google Client ID</div>;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="App">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => console.log('Login Failed')}
        />

             {/* Show the form only if logged in */}
        {loggedIn && (
          <>
            <h2>Add a Location</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Location Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={lat}
                onChange={e => setLat(e.target.value)}
                required
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={lng}
                onChange={e => setLng(e.target.value)}
                required
              />

              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="general">General</option>
                <option value="landmark">Landmark</option>
                <option value="cafe">Cafe</option>
                <option value="park">Park</option>
                <option value="study">Study</option>
                <option value="food">Food</option>
              </select>

              <button type="submit">Add Location</button>

            </form>
            {message && <p>{message}</p>}
          </>
        )}
        {/* Optionally show messages when not logged in */}
        {!loggedIn && message && <p>{message}</p>}

      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
