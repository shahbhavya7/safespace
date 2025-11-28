import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

// Google OAuth Client ID from environment variable
// Get your own Client ID from: https://console.cloud.google.com/
// See SETUP_GOOGLE_OAUTH.md for complete setup instructions
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

if (!GOOGLE_CLIENT_ID) {
  console.warn('⚠️ Google OAuth is not configured. Set VITE_GOOGLE_CLIENT_ID in .env file.');
  console.warn('📖 See SETUP_GOOGLE_OAUTH.md for setup instructions.');
}

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);
