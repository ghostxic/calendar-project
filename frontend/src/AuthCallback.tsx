import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthCallback: Processing OAuth callback...');
    console.log('AuthCallback: Current URL:', window.location.href);
    console.log('AuthCallback: Search params:', window.location.search);
    
    // Set a flag to show this component was reached
    localStorage.setItem('auth_callback_reached', JSON.stringify({
      timestamp: new Date().toISOString(),
      url: window.location.href,
      search: window.location.search,
      hash: window.location.hash
    }));
    
    // Parse token from hash URL (e.g., #/auth/callback?token=...)
    const hash = window.location.hash;
    console.log('AuthCallback: Full hash:', hash);
    
    const hashParts = hash.split('?');
    console.log('AuthCallback: Hash parts:', hashParts);
    
    const queryString = hashParts[1] || '';
    console.log('AuthCallback: Query string:', queryString);
    
    const hashParams = new URLSearchParams(queryString);
    const token = hashParams.get('token');
    
    console.log('AuthCallback: Token from URL:', token);
    console.log('AuthCallback: Token length:', token ? token.length : 0);
    
    // Store detailed parsing debug info
    localStorage.setItem('token_parsing_debug', JSON.stringify({
      timestamp: new Date().toISOString(),
      fullHash: hash,
      hashParts: hashParts,
      queryString: queryString,
      tokenFound: !!token,
      tokenLength: token ? token.length : 0
    }));
    
    if (token) {
      console.log('AuthCallback: Token found, storing in localStorage...');
      localStorage.setItem('authToken', token);
      
      // Verify token was stored
      const storedToken = localStorage.getItem('authToken');
      console.log('AuthCallback: Token stored successfully:', storedToken ? 'Yes' : 'No');
      console.log('AuthCallback: Stored token length:', storedToken ? storedToken.length : 0);
      
      // Store debug info about token storage
      localStorage.setItem('token_storage_debug', JSON.stringify({
        timestamp: new Date().toISOString(),
        tokenLength: token.length,
        storedSuccessfully: !!storedToken,
        storedTokenLength: storedToken ? storedToken.length : 0
      }));
      
      console.log('AuthCallback: Navigating to home...');
      navigate('/');
    } else {
      console.log('AuthCallback: No token found, navigating to home...');
      navigate('/');
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '2rem',
          height: '2rem',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p style={{ color: '#6b7280' }}>Authenticating...</p>
      </div>
    </div>
  );
}
