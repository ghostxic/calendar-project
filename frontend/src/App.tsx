import { useState, useEffect } from 'react'
import './styles/App.css' // will need to move away from in-line styling for ease 

interface Event {
  id: string;
  title: string;
  start: string | { dateTime?: string; date?: string };
  end: string | { dateTime?: string; date?: string };
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
      
      // Get user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('User timezone:', userTimezone);
      
      const response = await fetch(`${API_BASE_URL}/events/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          text: inputText,
          timezone: userTimezone
        }),
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
    
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">
            Plaintext Calendar
          </h1>
          <p className="auth-description">
            Convert natural language to calendar events
          </p>
          
          <button
            onClick={handleGoogleAuth}
            className="google-signin-button"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-container">
          <div className="header-inner">
            <h1 className="header-title">
              Plaintext Calendar
            </h1>
            <button
              onClick={handleLogout}
              className="logout-button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Backend Status Banner */}
      {backendStatus === 'offline' && (
        <div className="status-banner">
          <div className="status-text">
            ⚠️ Backend server is offline. Please deploy the backend to Railway to use this app.
          </div>
        </div>
      )}

             <main className="main-content">
               <div className="columns-container">
                 {/* Input Section */}
                 <div className="column-card">
            <h2 className="section-title">
              Schedule an Event
            </h2>
            <form onSubmit={handleSubmit} className="form-container">
              <div>
                <label htmlFor="eventInput" className="form-label">
                  Describe your event in natural language
                </label>
                <textarea
                  id="eventInput"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="e.g., 'Gym session tomorrow for 2 hours at the arc gym' or 'Meeting with team next Friday at 2pm'"
                  className="event-textarea"
                  rows={4}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                onClick={() => console.log('Button clicked!')}
                className="submit-button"
              >
                {isLoading ? 'Processing...' : 'Create Event'}
              </button>
            </form>
          </div>

                 {/* Events List */}
                 <div className="column-card">
            <h2 className="section-title">
              Upcoming Events
            </h2>
            <div className="events-list">
              {events.length === 0 ? (
                <div className="no-events-message">
                  <p>No events scheduled</p>
                </div>
              ) : (
                events.map((event) => {
                  // Handle different date formats from Google Calendar
                  const getDateString = (dateField: string | { dateTime?: string; date?: string }) => {
                    if (typeof dateField === 'string') {
                      return dateField;
                    } else {
                      return dateField?.dateTime || dateField?.date || '';
                    }
                  };
                  
                  const startDate = getDateString(event.start);
                  const endDate = getDateString(event.end);
                  
                  const formatDate = (dateStr: string) => {
                    try {
                      const date = new Date(dateStr);
                      return isNaN(date.getTime()) ? 'Date TBD' : date.toLocaleString();
                    } catch {
                      return 'Date TBD';
                    }
                  };
                  
                  return (
                    <div key={event.id} className="event-item">
                      <h3 className="event-title">{event.title || event.summary}</h3>
                      <p className="event-date">
                        {formatDate(startDate)} - {formatDate(endDate)}
                      </p>
                      {event.location && (
                        <p className="event-location">
                          📍 {event.location}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Show modal only when there's an event to confirm */}
      {showConfirmation && pendingEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-inner">
              <div className="modal-header">
                <h2 className="modal-title">Confirm Event</h2>
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setPendingEvent(null);
                  }}
                  className="modal-close-button"
                >
                  ×
                </button>
              </div>
              
              <div className="modal-details">
                <div className="modal-detail-item">
                  <div className="detail-label">Title</div>
                  <div className="detail-value">{pendingEvent?.title}</div>
                </div>
                
                <div className="modal-detail-item">
                  <div className="detail-label">Start Time</div>
                  <div className="detail-value">{new Date(pendingEvent?.start).toLocaleString()}</div>
                </div>
                
                <div className="modal-detail-item">
                  <div className="detail-label">End Time</div>
                  <div className="detail-value">{new Date(pendingEvent?.end).toLocaleString()}</div>
                </div>
                
                {pendingEvent?.location && (
                  <div className="modal-detail-item">
                    <div className="detail-label">Location</div>
                    <div className="detail-value">{pendingEvent.location}</div>
                  </div>
                )}
                
                {/* Availability Status */}
                {pendingEvent?.availability && (
                  <div className="availability-status">
                    {pendingEvent.availability.isAvailable ? (
                      <div className="availability-available">
                        <div>
                          <span>✅ Time slot is available!</span>
                        </div>
                      </div>
                    ) : (
                      <div className="availability-conflict">
                        <div className="conflict-banner">
                          <div>
                            <span>⚠️ Time slot conflicts with existing events</span>
                          </div>
                          
                          {pendingEvent.availability.conflicts && pendingEvent.availability.conflicts.length > 0 && (
                            <div className="conflict-list">
                              <div className="conflict-list-title">Conflicts with:</div>
                              {pendingEvent.availability.conflicts.map((conflict: any, index: number) => (
                                <div key={index} className="conflict-item">
                                  • {conflict.title || conflict.summary || 'Untitled Event'} ({new Date(conflict.start?.dateTime || conflict.start?.date || conflict.start).toLocaleString()})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {pendingEvent.availability.suggestedTimes && pendingEvent.availability.suggestedTimes.length > 0 && (
                          <div className="suggested-times-container">
                            <div className="suggested-times-title">Suggested times:</div>
                            {pendingEvent.availability.suggestedTimes.map((time: string, index: number) => (
                              <div key={index} className="suggested-time-item">
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
              
              <div className="modal-actions">
                <button 
                  onClick={() => {
                    setShowConfirmation(false);
                    setPendingEvent(null);
                  }}
                  className="modal-button modal-button-cancel"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmEvent}
                  className="modal-button modal-button-create"
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