import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvent  } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom vivid RED icon for map markers
const vividIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', // vivid red
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

//Yellow Icon
const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/**
 * Calculates the Haversine distance (in miles) between two latitude/longitude points.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 3958.8; // miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * React-leaflet component that listens for map clicks and updates clicked coordinates in state.
 */
function ClickHandler({ setClickedCoords, setLat, setLng }) {
  useMapEvent('click', (e) => {
    setClickedCoords([e.latlng.lat, e.latlng.lng]);
    setLat(e.latlng.lat.toFixed(7));
    setLng(e.latlng.lng.toFixed(7));
  });
  return null;
}

/**
 * Calculates a bounding box (min/max lat/lng) around a point for a given radius in miles.
 */
function getBoundingBox(lat, lng, miles) {
  // 1 degree latitude ≈ 69 miles
  const latDelta = miles / 69;
  // 1 degree longitude ≈ 69 * cos(latitude in radians)
  const lngDelta = miles / (69 * Math.cos(lat * Math.PI / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
}

function App() {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [type, setType] = useState('general');
  const [message, setMessage] = useState('');

  const [spots, setSpots] = useState([]);
  const [clickedCoords, setClickedCoords] = useState(null);

/**
   * Fetches all spots from the backend on mount (for initial map display).
   */
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/spots`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setSpots(data.spots || []))
      .catch(() => setSpots([]));
  }, [apiBaseUrl]);

 /**
   * Fetches spots within 1 mile of the clicked coordinates using the bounding box API.
   * Runs whenever the user clicks on the map.
   */
  useEffect(() => {
    if (!clickedCoords) return;
    const [lat, lng] = clickedCoords;
    const bbox = getBoundingBox(lat, lng, 1); // 1 mile
    fetch(`${apiBaseUrl}/api/spots/bbox?minLng=${bbox.minLng}&minLat=${bbox.minLat}&maxLng=${bbox.maxLng}&maxLat=${bbox.maxLat}`)
      .then(res => res.json())
      .then(data => setSpots(Array.isArray(data) ? data : []))
      .catch(() => setSpots([]));
  }, [clickedCoords, apiBaseUrl]);

  console.log('Google Client ID loaded:', googleClientId ? 'Yes' : 'No');
  /**
   * Handles Google login success by sending the credential to the backend for verification.
   */

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


/**
   * Handles form submission for adding a new spot to the backend.
   */
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

  const defaultCenter = clickedCoords
    ? [clickedCoords[0], clickedCoords[1]]
    : [33.973604, -117.328175];



// React code creates the ---User Interface---
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

        {/* Map container */}
        <h2>OpenFreeMap</h2>
        {clickedCoords && (
          <div style={{ margin: '10px 0', fontWeight: 'bold' }}>
            Clicked Coordinates: Lat {clickedCoords[0].toFixed(6)}, Lng {clickedCoords[1].toFixed(6)}
          </div>
        )}

        <MapContainer center={defaultCenter} zoom={13} style={{ height: "500px", width: "100%" }}>

          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickHandler 
          setClickedCoords={setClickedCoords} 
          setLat={setLat} 
          setLng={setLng} />

          {clickedCoords && (
            <Marker position={clickedCoords} icon={yellowIcon}>
              <Popup autoOpen={true}>
                <b>Selected Location</b><br />
                Lat: {clickedCoords[0].toFixed(6)}<br />
                Lng: {clickedCoords[1].toFixed(6)}
              </Popup>
            </Marker>
          )}

          {spots.map((spot, idx) => (
            <Marker
              key={idx}
              position={[spot.coordinates[1], spot.coordinates[0]]}
              icon={vividIcon}
            >
              <Popup>
                <b>{spot.name}</b><br />
                Type: {spot.type}
              </Popup>

            </Marker>
          ))}

        </MapContainer>

        {clickedCoords && (
          <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>Around your clicked coords</h3>
            {spots.length === 0 ? (
              <p>No spots within 1 mile.</p>
            ) : (
              <ul>
                {spots.map((spot, idx) => (
                  <li key={idx}>
                    <strong>{spot.name}</strong><br />
                    Lat: {spot.coordinates[1].toFixed(6)}, Lng: {spot.coordinates[0].toFixed(6)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Optionally show messages when not logged in */}
        {!loggedIn && message && <p>{message}</p>}

      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
