import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthCallback: Processing OAuth callback...');
    console.log('AuthCallback: Current URL:', window.location.href);
    console.log('AuthCallback: Search params:', window.location.search);
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    console.log('AuthCallback: Token from URL:', token);
    
    if (token) {
      console.log('AuthCallback: Token found, storing in localStorage...');
      localStorage.setItem('authToken', token);
      console.log('AuthCallback: Token stored, navigating to home...');
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
