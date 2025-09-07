import { useState, useEffect } from 'react'

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  summary?: string; // For Google Calendar events
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const API_BASE_URL = import.meta.env.PROD 
    ? 'https://calendar-project-production.up.railway.app/api'
    : 'http://localhost:3001/api';
  
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Check backend status
    checkBackendStatus();
    
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    console.log('App: Checking authentication...');
    console.log('App: Token from localStorage:', token);
    console.log('App: Current URL:', window.location.href);
    console.log('App: Current hash:', window.location.hash);
    
    // Store debug info in localStorage for persistence
    localStorage.setItem('debug_auth_check', JSON.stringify({
      timestamp: new Date().toISOString(),
      token: token ? 'present' : 'missing',
      url: window.location.href,
      hash: window.location.hash
    }));
    
    if (token) {
      console.log('App: Token found, setting authenticated to true...');
      setIsAuthenticated(true);
      fetchEvents();
    } else {
      console.log('App: No token found, user not authenticated');
    }
  }, []);

  const checkBackendStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error: any) {
      console.error('Error fetching events:', error);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      console.log('Initiating Google OAuth...');
      console.log('API URL:', `${API_BASE_URL}/auth/google`);
      
      const response = await fetch(`${API_BASE_URL}/auth/google`);
      console.log('OAuth response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('OAuth data received:', data);
      console.log('Redirecting to:', data.authUrl);
      
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error initiating auth:', error);
      alert('Authentication failed. Please check the console for details.');
    }
  };

  const handleLogout = () => {
    console.log('App: Logout called, removing token and setting authenticated to false');
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setEvents([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted, inputText:', inputText);
    if (!inputText.trim()) {
      console.log('No input text, returning');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      console.log('Token found:', token ? 'Yes' : 'No');
      console.log('Making request to:', `${API_BASE_URL}/events/process`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${API_BASE_URL}/events/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: inputText }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        console.log('Setting pending event:', data.event);
        setPendingEvent({
          ...data.event,
          availability: data.availability
        });
        console.log('Setting show confirmation to true');
        setShowConfirmation(true);
        setInputText('');
      } else {
        const errorData = await response.text();
        console.error('Response error:', errorData);
      }
    } catch (error: any) {
      console.error('Error processing text:', error);
      if (error.name === 'AbortError') {
        console.error('Request timed out after 30 seconds');
        alert('Request timed out. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmEvent = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pendingEvent)
      });

      if (response.ok) {
        setShowConfirmation(false);
        setPendingEvent(null);
        fetchEvents(); // Refresh events
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
    }
  };


  if (!isAuthenticated) {
    // Get debug info from localStorage
    const debugInfo = localStorage.getItem('debug_auth_check');
    const parsedDebug = debugInfo ? JSON.parse(debugInfo) : null;
    
    const authCallbackInfo = localStorage.getItem('auth_callback_reached');
    const parsedAuthCallback = authCallbackInfo ? JSON.parse(authCallbackInfo) : null;
    
    return (
      <div style={{ 
        height: '100vh', 
        width: '100vw',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '3rem 2rem',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%',
          border: '1px solid #f3f4f6'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Plaintext Calendar
          </h1>
          <p style={{
            color: '#6b7280',
            marginBottom: '2rem',
            fontSize: '1.125rem',
            lineHeight: '1.6'
          }}>
            Convert natural language to calendar events
          </p>
          
          {/* Debug Info */}
          {(parsedDebug || parsedAuthCallback) && (
            <div style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              textAlign: 'left'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Debug Info:</div>
              {parsedDebug && (
                <>
                  <div>Token: {parsedDebug.token}</div>
                  <div>URL: {parsedDebug.url}</div>
                  <div>Hash: {parsedDebug.hash}</div>
                  <div>Time: {parsedDebug.timestamp}</div>
                </>
              )}
              {parsedAuthCallback && (
                <>
                  <div style={{ marginTop: '0.5rem', fontWeight: '600' }}>AuthCallback Reached:</div>
                  <div>URL: {parsedAuthCallback.url}</div>
                  <div>Search: {parsedAuthCallback.search}</div>
                  <div>Time: {parsedAuthCallback.timestamp}</div>
                </>
              )}
            </div>
          )}
          <button
            onClick={handleGoogleAuth}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              fontWeight: '600',
              padding: '0.875rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              width: '100%',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
            }}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
        borderBottom: '1px solid #e5e7eb',
        width: '100%'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 1rem',
          width: '100%'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1rem 0' 
          }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
              Plaintext Calendar
            </h1>
            <button
              onClick={handleLogout}
              style={{ 
                color: '#4b5563', 
                backgroundColor: '#f3f4f6', 
                padding: '0.5rem 1rem', 
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#1f2937';
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#4b5563';
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Backend Status Banner */}
      {backendStatus === 'offline' && (
        <div style={{
          backgroundColor: '#fef2f2',
          borderBottom: '1px solid #fecaca',
          padding: '0.75rem 1rem',
          textAlign: 'center'
        }}>
          <div style={{ color: '#991b1b', fontWeight: '500' }}>
            ⚠️ Backend server is offline. Please deploy the backend to Railway to use this app.
          </div>
        </div>
      )}

      <main style={{ 
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '2rem',
          width: '100%',
          maxWidth: '900px',
          justifyItems: 'center'
        }}>
          {/* Input Section */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.75rem', 
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
            padding: '2rem', 
            border: '1px solid #f3f4f6',
            width: '100%',
            maxWidth: '450px'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
              Schedule an Event
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
                <label htmlFor="eventInput" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.75rem' }}>
                  Describe your event in natural language
                </label>
                <textarea
                  id="eventInput"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="e.g., 'Gym session tomorrow for 2 hours at the arc gym' or 'Meeting with team next Friday at 2pm'"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.5rem', 
                    backgroundColor: 'white', 
                    color: '#111827',
                    resize: 'none',
                    outline: 'none'
                  }}
                  rows={4}
                />
      </div>
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                onClick={() => console.log('Button clicked!')}
                style={{ 
                  width: '100%', 
                  backgroundColor: isLoading || !inputText.trim() ? '#9ca3af' : '#2563eb', 
                  color: 'white', 
                  fontWeight: '600', 
                  padding: '0.75rem 1.5rem', 
                  borderRadius: '0.5rem', 
                  border: 'none',
                  cursor: isLoading || !inputText.trim() ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                {isLoading ? 'Processing...' : 'Create Event'}
        </button>
            </form>
          </div>

          {/* Events List */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.75rem', 
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
            padding: '2rem', 
            border: '1px solid #f3f4f6',
            width: '100%',
            maxWidth: '450px'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
              Upcoming Events
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <p style={{ color: '#6b7280' }}>No events scheduled</p>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} style={{ 
                    borderLeft: '4px solid #3b82f6', 
                    paddingLeft: '1.5rem', 
                    padding: '1rem', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>{event.title || event.summary}</h3>
                    <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                      {new Date(event.start).toLocaleString()}
                    </p>
                    {event.location && (
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Show modal only when there's an event to confirm */}
      {showConfirmation && pendingEvent && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 50, 
          padding: '1rem' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '1rem', 
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
            maxWidth: '28rem', 
            width: '100%', 
            maxHeight: '90vh', 
            overflowY: 'auto' 
          }}>
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>Confirm Event</h2>
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setPendingEvent(null);
                  }}
                  style={{ 
                    color: '#9ca3af', 
                    backgroundColor: 'transparent', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: '1.5rem'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#4b5563'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                >
                  ×
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Title</div>
                  <div style={{ color: '#111827', fontWeight: '600' }}>{pendingEvent?.title}</div>
                </div>
                
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Start Time</div>
                  <div style={{ color: '#111827' }}>{new Date(pendingEvent?.start).toLocaleString()}</div>
                </div>
                
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>End Time</div>
                  <div style={{ color: '#111827' }}>{new Date(pendingEvent?.end).toLocaleString()}</div>
                </div>
                
                {pendingEvent?.location && (
                  <div style={{ backgroundColor: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Location</div>
                    <div style={{ color: '#111827' }}>{pendingEvent.location}</div>
                  </div>
                )}
                
                {/* Availability Status */}
                {pendingEvent?.availability && (
                  <div style={{ marginTop: '1rem' }}>
                    {pendingEvent.availability.isAvailable ? (
                      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ color: '#166534', fontWeight: '500' }}>✅ Time slot is available!</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1rem' }}>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <span style={{ color: '#991b1b', fontWeight: '500' }}>⚠️ Time slot conflicts with existing events</span>
                          </div>
                          
                          {pendingEvent.availability.conflicts && pendingEvent.availability.conflicts.length > 0 && (
                            <div style={{ marginTop: '0.75rem' }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#b91c1c', marginBottom: '0.5rem' }}>Conflicts with:</div>
                              {pendingEvent.availability.conflicts.map((conflict: any, index: number) => (
                                <div key={index} style={{ fontSize: '0.875rem', color: '#dc2626', backgroundColor: 'white', borderRadius: '0.25rem', padding: '0.5rem', marginBottom: '0.25rem' }}>
                                  • {conflict.title || conflict.summary || 'Untitled Event'} ({new Date(conflict.start?.dateTime || conflict.start?.date || conflict.start).toLocaleString()})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {pendingEvent.availability.suggestedTimes && pendingEvent.availability.suggestedTimes.length > 0 && (
                          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fed7aa', borderRadius: '0.5rem', padding: '1rem' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#92400e', marginBottom: '0.5rem' }}>Suggested times:</div>
                            {pendingEvent.availability.suggestedTimes.map((time: string, index: number) => (
                              <div key={index} style={{ fontSize: '0.875rem', color: '#b45309', backgroundColor: 'white', borderRadius: '0.25rem', padding: '0.5rem', marginBottom: '0.25rem' }}>
                                • {new Date(time).toLocaleString()}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={() => {
                    setShowConfirmation(false);
                    setPendingEvent(null);
                  }}
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem 1rem', 
                    border: '1px solid #d1d5db', 
                    color: '#374151', 
                    borderRadius: '0.5rem', 
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmEvent}
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem 1rem', 
                    backgroundColor: '#2563eb', 
                    color: 'white', 
                    borderRadius: '0.5rem', 
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {console.log('Modal state - showConfirmation:', showConfirmation, 'pendingEvent:', pendingEvent)}
      </div>
  );
}

export default App
