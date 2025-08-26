import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvent  } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom vivid red icon for map markers
const vividIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', // vivid red
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
function ClickHandler({ setClickedCoords }) {
  useMapEvent('click', (e) => {
    setClickedCoords([e.latlng.lat, e.latlng.lng]);
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
    : [37.7749, -122.4194];



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
          <ClickHandler setClickedCoords={setClickedCoords} />
          {spots.map((spot, idx) => (
            <Marker
              key={(spot._id && spot._id.toString && spot._id.toString()) || spot.id || idx}
              position={[spot.coordinates[1], spot.coordinates[0]]}
              icon={vividIcon}
            >
              <Popup>
                <SpotPopup
                  spot={spot}
                  apiBaseUrl={apiBaseUrl}
                  loggedIn={loggedIn}
                />
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


function SpotPopup({ spot, apiBaseUrl, loggedIn }) {
  // Ratings are saved as special meta-comments like "__RATING__:4"
  const RATING_PREFIX = '__RATING__:';

  const [comments, setComments] = React.useState([]);
  const [newComment, setNewComment] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  // Likes
  const [likeCount, setLikeCount] = React.useState(0);
  const [iLikeIt, setILikeIt] = React.useState(false);

  // Who am I (to filter/update my rating meta-comments)?
  const [me, setMe] = React.useState(null); // { googleId }
  const [myRating, setMyRating] = React.useState(null);
  const [avgRating, setAvgRating] = React.useState(null);
  const [ratingCount, setRatingCount] = React.useState(0);

  const spotId = (spot._id && spot._id.toString && spot._id.toString()) || spot.id;

  // Load profile (only if logged in)
  React.useEffect(() => {
    if (!loggedIn) return;
    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/profile`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setMe({ googleId: data.user.googleId });
        }
      } catch {/* ignore */}
    })();
  }, [apiBaseUrl, loggedIn]);

  // Load comments + compute ratings-from-comments
  const loadComments = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/spots/${spotId}/comments`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load comments');
      const thread = await res.json();

      // flatten threaded comments for simple rendering
      const flat = [];
      const walk = (n, depth = 0) => {
        flat.push({ ...n, depth });
        (n.replies || []).forEach(r => walk(r, depth + 1));
      };
      (thread || []).forEach(n => walk(n));

      setComments(flat);

      // derive ratings from meta-comments
      const ratings = flat
        .filter(c => typeof c.text === 'string' && c.text.startsWith(RATING_PREFIX))
        .map(c => {
          const v = parseInt(c.text.slice(RATING_PREFIX.length), 10);
          return Number.isFinite(v) ? { value: v, user_id: c.user_id, created_at: c.created_at } : null;
        })
        .filter(Boolean);

      if (ratings.length) {
        const sum = ratings.reduce((s, r) => s + r.value, 0);
        setAvgRating((sum / ratings.length).toFixed(2));
        setRatingCount(ratings.length);
      } else {
        setAvgRating(null);
        setRatingCount(0);
      }

      if (me?.googleId) {
        const mine = ratings
          .filter(r => r.user_id === me.googleId)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        setMyRating(mine ? mine.value : null);
      }
    } catch (e) {
      setError(e.message || 'Error loading');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, spotId, me?.googleId]);

  // Load likes (count + whether I like it)
  const loadLikes = React.useCallback(async () => {
    try {
      // count
      const c = await fetch(`${apiBaseUrl}/api/spots/${spotId}/likes`);
      if (c.ok) {
        const { count } = await c.json();
        setLikeCount(count ?? 0);
      }
      // my like status (needs auth)
      if (loggedIn) {
        const m = await fetch(`${apiBaseUrl}/api/spots/${spotId}/likes/check`, { credentials: 'include' });
        if (m.ok) {
          const { liked } = await m.json();
          setILikeIt(!!liked);
        }
      }
    } catch {/* ignore */}
  }, [apiBaseUrl, spotId, loggedIn]);

  React.useEffect(() => {
    loadComments();
    loadLikes();
  }, [loadComments, loadLikes]);

  // Post a regular comment
  const postComment = async () => {
    if (!loggedIn) return setError('Please sign in to comment.');
    if (!newComment.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/spots/${spotId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to post comment');
      }
      setNewComment('');
      await loadComments();
    } catch (e) {
      setError(e.message || 'Error posting comment');
    } finally {
      setSaving(false);
    }
  };

  // Save a 1–5 star rating as a meta-comment
  const saveRating = async (value) => {
    if (!loggedIn) return setError('Please sign in to rate.');
    setSaving(true);
    setError('');
    try {
      // Best-effort delete my previous rating meta-comments (only my own comments are deletable)
      if (me?.googleId) {
        const mine = comments.filter(
          c => c.user_id === me.googleId && typeof c.text === 'string' && c.text.startsWith(RATING_PREFIX)
        );
        for (const c of mine) {
          try {
            await fetch(`${apiBaseUrl}/api/comments/${c._id}`, {
              method: 'DELETE',
              credentials: 'include'
            });
          } catch {/* ignore */}
        }
      }
      // Post new rating meta-comment
      const res = await fetch(`${apiBaseUrl}/api/spots/${spotId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${RATING_PREFIX}${value}` })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to save rating');
      }
      setMyRating(value);
      await loadComments();
    } catch (e) {
      setError(e.message || 'Error saving rating');
    } finally {
      setSaving(false);
    }
  };

  // Toggle like/unlike
  const toggleLike = async () => {
    if (!loggedIn) return setError('Please sign in to like.');
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/spots/${spotId}/likes`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to toggle like');
      }
      // refresh like count and my status
      await loadLikes();
    } catch (e) {
      setError(e.message || 'Error toggling like');
    } finally {
      setSaving(false);
    }
  };

  // Hide the rating meta-comments from the visible list
  const visibleComments = comments.filter(c => !(typeof c.text === 'string' && c.text.startsWith(RATING_PREFIX)));

  return (
    <div style={{ minWidth: 260, maxWidth: 320 }}>
      <div style={{ marginBottom: 8 }}>
        <strong>{spot.name}</strong><br />
        <small>Type: {spot.type}</small>
      </div>

      {/* Likes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <button
          onClick={toggleLike}
          disabled={!loggedIn || saving}
          title={loggedIn ? (iLikeIt ? 'Unlike' : 'Like') : 'Sign in to like'}
          style={{ cursor: loggedIn ? 'pointer' : 'not-allowed' }}
        >
          {iLikeIt ? '♥ Unlike' : '♡ Like'}
        </button>
        <span style={{ fontSize: 12, opacity: 0.75 }}>{likeCount} like{likeCount === 1 ? '' : 's'}</span>
      </div>

      {/* Rating */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[1,2,3,4,5].map(star => (
            <button
              key={star}
              onClick={() => saveRating(star)}
              disabled={saving || !loggedIn}
              aria-label={`Rate ${star} star${star>1?'s':''}`}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: loggedIn ? 'pointer' : 'not-allowed',
                fontSize: 18,
                lineHeight: 1
              }}
              title={loggedIn ? `Set rating to ${star}` : 'Sign in to rate'}
            >
              {(myRating || 0) >= star ? '★' : '☆'}
            </button>
          ))}
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {avgRating ? `${avgRating} / 5 (${ratingCount})` : '(no ratings yet)'}
          </span>
        </div>
      </div>

      {/* Comments */}
      <div style={{ marginBottom: 6 }}>
        <strong>Comments</strong>
      </div>
      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: 'crimson' }}>{error}</div>
      ) : visibleComments.length === 0 ? (
        <div style={{ fontStyle: 'italic', opacity: 0.7 }}>No comments yet.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 140, overflowY: 'auto' }}>
          {visibleComments.map(c => (
            <li key={c._id} style={{ marginBottom: 6, paddingLeft: c.depth * 10 }}>
              <div style={{ fontSize: 13 }}>{c.text}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                {new Date(c.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add comment */}
      <div style={{ marginTop: 8 }}>
        <textarea
          rows={2}
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder={loggedIn ? 'Write a comment…' : 'Sign in to comment'}
          disabled={!loggedIn || saving}
          style={{ width: '100%' }}
        />
        <button onClick={postComment} disabled={!loggedIn || saving || !newComment.trim()} style={{ marginTop: 6 }}>
          Post
        </button>
      </div>
    </div>
  );
}



export default App;
