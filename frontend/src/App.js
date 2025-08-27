import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import React, { useState, useEffect, useMemo, useRef } from 'react';
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

function FilterPanel({ spots, onSelectSpot, collapsed, setCollapsed }) {
  // category checkboxes (client-side only)
  const CATEGORIES = ['general', 'landmark', 'cafe', 'park', 'study', 'food'];

  const [pending, setPending] = React.useState(new Set());   // boxes currently checked
  const [applied, setApplied] = React.useState(new Set());   // what the list uses

  const toggle = (cat) => {
    setPending(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const apply = () => setApplied(new Set(pending));
  const clear = () => { setPending(new Set()); setApplied(new Set()); };

  // if no category is applied, show all spots
  const filtered = useMemo(() => {
    if (!applied || applied.size === 0) return spots;
    return spots.filter(s => applied.has((s?.type || 'general')));
  }, [spots, applied]);

  // Collapsed (mini) view
  if (collapsed) {
    return (
      <aside
        style={{
          width: 44,
          minWidth: 44,
          maxHeight: 520,
          border: '1px solid #ddd',
          borderRadius: 10,
          padding: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          background: '#fff'
        }}
        title="Expand filter panel"
      >
        <button onClick={() => setCollapsed(false)} aria-label="Expand" title="Expand"
          style={{ width: 28, height: 28 }}>
          ❯
        </button>
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 12, opacity: 0.7 }}>
          Filter
        </div>
      </aside>
    );
  }

  // Expanded view
  return (
    <aside
      style={{
        width: 280,
        minWidth: 280,
        maxHeight: 520,
        border: '1px solid #ddd',
        borderRadius: 10,
        padding: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: '#fff'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Filter</div>
        <button onClick={() => setCollapsed(true)} aria-label="Collapse" title="Collapse"
          style={{ width: 28, height: 28 }}>
          ❮
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 6, columnGap: 8 }}>
        {CATEGORIES.map(cat => (
          <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={pending.has(cat)}
              onChange={() => toggle(cat)}
            />
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={apply}>Search</button>
        <button onClick={clear} disabled={pending.size === 0 && applied.size === 0}>Clear</button>
      </div>

      <div style={{ fontWeight: 600, marginTop: 4 }}>
        Results {applied.size > 0 ? `(${Array.from(applied).join(', ')})` : '(All)'} — {filtered.length}
      </div>

      {/* Names-only list (CLICKABLE) */}
      <div style={{ overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ opacity: 0.7, fontStyle: 'italic' }}>No spots.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {filtered.map((spot, idx) => (
              <li
                key={(spot._id && spot._id.toString && spot._id.toString()) || spot.id || idx}
                onClick={() => onSelectSpot(spot)}
                style={{
                  marginBottom: 6,
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                title="Show on map"
              >
                {spot.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}



function App() {
  const RATING_PREFIX = '__RATING__:';

  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [type, setType] = useState('general');
  const [message, setMessage] = useState('');
    const [currentUser, setCurrentUser] = useState(() => {
      try {
        const raw = localStorage.getItem('ofm_user');
        return raw ? JSON.parse(raw) : null; 
      } catch {
        return null;
      }
    });
  

  const [spots, setSpots] = useState([]);
  const [clickedCoords, setClickedCoords] = useState(null);
    // Map + marker refs, and panel collapse state
  const [likesBySpot, setLikesBySpot] = useState({});
  const mapRef = useRef(null);
  const markerRefs = useRef({});     // { [id]: L.Marker }
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // Focus a spot on the map and open its popup
  const focusSpot = (spot) => {
    if (!spot) return;
    const lat = spot.coordinates[1];
    const lng = spot.coordinates[0];
    if (mapRef.current) {
      // smooth pan/zoom
      mapRef.current.flyTo([lat, lng], Math.max(mapRef.current.getZoom(), 16), { duration: 0.75 });
    }
    const id =
      (spot._id && spot._id.toString && spot._id.toString()) ||
      spot.id;
    const m = markerRefs.current[id];
    if (m && m.openPopup) {
      // open after the flyTo starts for better UX
      setTimeout(() => m.openPopup(), 300);
    }
  };


/**
   * Fetches all spots from the backend on mount (for initial map display).
   */
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/spots`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setSpots(data.spots || []))
      .catch(() => setSpots([]));
  }, [apiBaseUrl]);


  useEffect(() => {
    if (!spots || spots.length === 0) {
      setLikesBySpot({});
      return;
    }
    let cancelled = false;
  
    (async () => {
      try {
        // fetch counts in parallel (cap to first 100 to be safe)
        const subset = spots.slice(0, 100);
        const entries = await Promise.all(
          subset.map(async (s, idx) => {
            const id =
              (s._id && s._id.toString && s._id.toString()) ||
              s.id || String(idx);
  
            try {
              const r = await fetch(`${apiBaseUrl}/api/spots/${encodeURIComponent(id)}/likes`);
              if (!r.ok) return [id, 0];
              const { count } = await r.json();
              return [id, typeof count === 'number' ? count : 0];
            } catch {
              return [id, 0];
            }
          })
        );
  
        if (!cancelled) {
          const map = {};
          for (const [id, count] of entries) map[id] = count;
          setLikesBySpot(map);
        }
      } catch {
        // ignore network errors; list will fall back to 0 likes
      }
    })();
  
    return () => { cancelled = true; };
  }, [spots, apiBaseUrl]);
  

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
        setCurrentUser(data.user); // <-- save user (has email/name/picture)
        try { localStorage.setItem('ofm_user', JSON.stringify(data.user)); } catch {}
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

<div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
  {/* LEFT: filter panel (names only) */}
  <FilterPanel
    spots={spots}
    onSelectSpot={focusSpot}
    collapsed={panelCollapsed}
    setCollapsed={setPanelCollapsed}
  />

  {/* RIGHT: the ONE map */}
  <div style={{ flex: 1 }}>
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: "500px", width: "100%" }}
      whenCreated={(map) => { mapRef.current = map; }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler
        setClickedCoords={setClickedCoords}
        setLat={setLat}
        setLng={setLng}
      />

      {clickedCoords && (
        <Marker position={clickedCoords} icon={yellowIcon}>
          <Popup autoOpen={true}>
            <b>Selected Location</b><br />
            Lat: {clickedCoords[0].toFixed(6)}<br />
            Lng: {clickedCoords[1].toFixed(6)}
          </Popup>
        </Marker>
      )}

      {spots.map((spot, idx) => {
        const id =
          (spot._id && spot._id.toString && spot._id.toString()) ||
          spot.id || idx;

        return (
          <Marker
            key={id}
            ref={(ref) => { if (ref) markerRefs.current[id] = ref; }}
            position={[spot.coordinates[1], spot.coordinates[0]]}
            icon={vividIcon}
          >
            <Popup>
              <SpotPopup
                spot={spot}
                apiBaseUrl={apiBaseUrl}
                loggedIn={loggedIn}
                currentUser={currentUser}
              />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  </div>
</div>


{clickedCoords && (
  <div style={{ marginTop: 20, padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
    <h3 style={{ marginTop: 0 }}>Top 5 spots near you</h3>

    {(() => {
      if (!Array.isArray(spots) || spots.length === 0) {
        return <p>No spots within 1 mile.</p>;
      }

      // build sortable array with like counts (fallback 0) and (optional) distance
      const data = spots.map((s, idx) => {
        const id =
          (s._id && s._id.toString && s._id.toString()) ||
          s.id || String(idx);
        const likes = likesBySpot[id] ?? 0;
        const dist = haversineDistance(
          clickedCoords[0], clickedCoords[1],
          s.coordinates[1], s.coordinates[0]
        );
        return { s, id, likes, dist };
      });

      // sort by likes desc, then distance asc for tie-break
      data.sort((a, b) => (b.likes - a.likes) || (a.dist - b.dist));

      const top5 = data.slice(0, 5);

      if (top5.length === 0) {
        return <p>No spots within 1 mile.</p>;
      }

      return (
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {top5.map(({ s, id, likes }) => (
            <li key={id} style={{ marginBottom: 8 }}>
              <strong>{s.name}</strong>
              <span style={{ marginLeft: 6, opacity: 0.7 }}>
                • {likes} like{likes === 1 ? '' : 's'}
              </span>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Lat: {s.coordinates[1].toFixed(6)}, Lng: {s.coordinates[0].toFixed(6)}
              </div>
            </li>
          ))}
        </ol>
      );
    })()}
  </div>
)}


        {/* Optionally show messages when not logged in */}
        {!loggedIn && message && <p>{message}</p>}

      </div>
    </GoogleOAuthProvider>
  );
}


function SpotPopup({ spot, apiBaseUrl, loggedIn }) {
  // silently hide any old rating meta-comments that might exist in DB
  const isHiddenMeta = (t) => typeof t === 'string' && t.startsWith('__RATING__:');

  const [comments, setComments] = React.useState([]);
  const [newComment, setNewComment] = React.useState('');
  const [replyOpen, setReplyOpen] = React.useState({}); // { [commentId]: bool }
  const [replyText, setReplyText] = React.useState({}); // { [commentId]: string }
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  // Likes
  const [likeCount, setLikeCount] = React.useState(0);
  const [iLikeIt, setILikeIt] = React.useState(false);

  // Current viewer (for labeling "You")
  const [me, setMe] = React.useState(null); // { googleId }

  // Cache user profiles { [googleId]: {name, email, picture} }
  const [userMap, setUserMap] = React.useState({});

  const spotId =
    (spot._id && spot._id.toString && spot._id.toString()) ||
    spot.id;

  // Load current viewer's googleId (for "You" label)
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

  // Load comments and then fetch missing author profiles via /api/users/:googleId
  const loadComments = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/spots/${spotId}/comments`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to load comments');

      const thread = await res.json();

      // Flatten thread while keeping depth for indentation
      const flat = [];
      const walk = (n, depth = 0) => {
        flat.push({ ...n, depth });
        (n.replies || []).forEach(r => walk(r, depth + 1));
      };
      (thread || []).forEach(n => walk(n));
      setComments(flat);

      // Fetch author profiles we don't have yet (route is auth-protected)
      const ids = [...new Set(flat.map(c => c.user_id).filter(Boolean))];
      const missing = ids.filter(id => !userMap[id]);

      if (loggedIn && missing.length) {
        const results = await Promise.all(
          missing.map(async (id) => {
            const r = await fetch(`${apiBaseUrl}/api/users/${encodeURIComponent(id)}`, {
              credentials: 'include'
            });
            if (!r.ok) return [id, null];
            const { user } = await r.json();
            return [id, { name: user.name, email: user.email, picture: user.picture }];
          })
        );
        setUserMap(prev => {
          const next = { ...prev };
          for (const [id, info] of results) {
            if (info) next[id] = info;
          }
          return next;
        });
      }
    } catch (e) {
      setError(e.message || 'Error loading comments');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, spotId, loggedIn]); // don't depend on userMap to avoid extra reloads

  // Load likes (count + my status)
  const loadLikes = React.useCallback(async () => {
    try {
      const c = await fetch(`${apiBaseUrl}/api/spots/${spotId}/likes`);
      if (c.ok) {
        const { count } = await c.json();
        setLikeCount(count ?? 0);
      }
      if (loggedIn) {
        const m = await fetch(`${apiBaseUrl}/api/spots/${spotId}/likes/check`, { credentials: 'include' });
        if (m.ok) {
          const { liked } = await m.json();
          setILikeIt(!!liked);
        }
      } else {
        setILikeIt(false);
      }
    } catch {/* ignore */}
  }, [apiBaseUrl, spotId, loggedIn]);

  React.useEffect(() => {
    loadComments();
    loadLikes();
  }, [loadComments, loadLikes]);

  // Helpers
  const labelFor = (c) => {
    const u = userMap[c.user_id];
    if (u?.email) return u.email;     // ← show email first
    if (u?.name) return u.name;
    if (me?.googleId && c.user_id === me.googleId) return 'You';
    const tail = (c.user_id && String(c.user_id).slice(-6)) || 'user';
    return `User · ${tail}`;
  };
  

  // Actions
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

  const postReply = async (parentId) => {
    if (!loggedIn) return setError('Please sign in to reply.');
    const text = (replyText[parentId] || '').trim();
    if (!text) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/spots/${spotId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, parentCommentId: parentId })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to post reply');
      }
      setReplyText(prev => ({ ...prev, [parentId]: '' }));
      setReplyOpen(prev => ({ ...prev, [parentId]: false }));
      await loadComments();
    } catch (e) {
      setError(e.message || 'Error posting reply');
    } finally {
      setSaving(false);
    }
  };

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
      await loadLikes();
    } catch (e) {
      setError(e.message || 'Error toggling like');
    } finally {
      setSaving(false);
    }
  };

  // Hide any old rating meta-comments (keeps UI free of rating mentions)
  const visibleComments = comments.filter(c => !isHiddenMeta(c.text));

  return (
    <div style={{ minWidth: 260, maxWidth: 340 }}>
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
        <span style={{ fontSize: 12, opacity: 0.75 }}>
          {likeCount} like{likeCount === 1 ? '' : 's'}
        </span>
      </div>

      {/* Comments & replies */}
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
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 180, overflowY: 'auto' }}>
          {visibleComments.map(c => (
            <li key={c._id} style={{ marginBottom: 10, paddingLeft: c.depth * 12 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>
                {labelFor(c)} • {new Date(c.created_at).toLocaleString()}
              </div>
              <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{c.text}</div>

              {/* Reply toggle + box */}
              <div style={{ marginTop: 4 }}>
                <button
                  onClick={() => setReplyOpen(prev => ({ ...prev, [c._id]: !prev[c._id] }))}
                  disabled={!loggedIn || saving}
                  style={{ fontSize: 12 }}
                >
                  {replyOpen[c._id] ? 'Cancel' : 'Reply'}
                </button>
              </div>

              {replyOpen[c._id] && (
                <div style={{ marginTop: 6 }}>
                  <textarea
                    rows={2}
                    value={replyText[c._id] || ''}
                    onChange={e => setReplyText(prev => ({ ...prev, [c._id]: e.target.value }))}
                    placeholder={loggedIn ? 'Write a reply…' : 'Sign in to reply'}
                    disabled={!loggedIn || saving}
                    style={{ width: '100%' }}
                  />
                  <button
                    onClick={() => postReply(c._id)}
                    disabled={!loggedIn || saving || !(replyText[c._id] || '').trim()}
                    style={{ marginTop: 4 }}
                  >
                    Post reply
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Add new top-level comment */}
      <div style={{ marginTop: 8 }}>
        <textarea
          rows={2}
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder={loggedIn ? 'Write a comment…' : 'Sign in to comment'}
          disabled={!loggedIn || saving}
          style={{ width: '100%' }}
        />
        <button
          onClick={postComment}
          disabled={!loggedIn || saving || !newComment.trim()}
          style={{ marginTop: 6 }}
        >
          Post
        </button>
      </div>
    </div>
  );
}



export default App;
