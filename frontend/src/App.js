import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function App() {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

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
      }
    } catch (error) {
      console.error('Login failed:', error);
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
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
