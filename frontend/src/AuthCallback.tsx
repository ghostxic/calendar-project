import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse token from React Router location
    const searchParams = new URLSearchParams(location.search);
    const tokenFromSearch = searchParams.get('token');
    
    // Also try parsing from window.location.hash as fallback
    const windowHash = window.location.hash;
    const hashParts = windowHash.split('?');
    const queryString = hashParts[1] || '';
    const hashParams = new URLSearchParams(queryString);
    const tokenFromHash = hashParams.get('token');
    
    // Use whichever token we found
    const token = tokenFromSearch || tokenFromHash;
    
    if (token) {
      localStorage.setItem('authToken', token);
      navigate('/');
    } else {
      navigate('/');
    }
  }, [navigate, location]);

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
