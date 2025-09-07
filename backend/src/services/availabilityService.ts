import { google } from 'googleapis';

export interface AvailabilityCheck {
  isAvailable: boolean;
  conflicts: any[];
  suggestedTimes?: string[];
}

export const checkAvailability = async (
  oauth2Client: any,
  startTime: string,
  endTime: string
): Promise<AvailabilityCheck> => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Get events in the time range
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startTime,
      timeMax: endTime,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const existingEvents = response.data.items || [];
    
    if (existingEvents.length === 0) {
      return {
        isAvailable: true,
        conflicts: []
      };
    }

    // Check for conflicts
    const conflicts = existingEvents.filter(event => {
      const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
      const eventEnd = new Date(event.end?.dateTime || event.end?.date || '');
      const requestedStart = new Date(startTime);
      const requestedEnd = new Date(endTime);
      
      // Check if events overlap
      return (eventStart < requestedEnd && eventEnd > requestedStart);
    });

    if (conflicts.length === 0) {
      return {
        isAvailable: true,
        conflicts: []
      };
    }

    // Generate suggested times
    const suggestedTimes = generateSuggestedTimes(startTime, endTime, existingEvents);
    
    return {
      isAvailable: false,
      conflicts,
      suggestedTimes
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    return {
      isAvailable: true, // Default to available if check fails
      conflicts: []
    };
  }
};

const generateSuggestedTimes = (originalStart: string, originalEnd: string, existingEvents: any[]): string[] => {
  const suggestions: string[] = [];
  const originalStartDate = new Date(originalStart);
  const originalEndDate = new Date(originalEnd);
  const duration = originalEndDate.getTime() - originalStartDate.getTime();
  
  // Try same day with different times
  const sameDay = new Date(originalStartDate);
  sameDay.setHours(9, 0, 0, 0); // 9 AM
  
  for (let hour = 9; hour <= 17; hour += 2) { // Try every 2 hours from 9 AM to 5 PM
    const testStart = new Date(sameDay);
    testStart.setHours(hour, 0, 0, 0);
    const testEnd = new Date(testStart.getTime() + duration);
    
    // Check if this time conflicts with existing events
    const hasConflict = existingEvents.some(event => {
      const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
      const eventEnd = new Date(event.end?.dateTime || event.end?.date || '');
      return (eventStart < testEnd && eventEnd > testStart);
    });
    
    if (!hasConflict) {
      suggestions.push(testStart.toISOString());
      if (suggestions.length >= 3) break; // Limit to 3 suggestions
    }
  }
  
  // If no suggestions for same day, try next day
  if (suggestions.length === 0) {
    const nextDay = new Date(originalStartDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(9, 0, 0, 0);
    suggestions.push(nextDay.toISOString());
  }
  
  return suggestions;
};
