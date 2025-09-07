import { Ollama } from 'ollama';
import OpenAI from 'openai';

// Initialize services based on environment
const ollama = process.env.NODE_ENV === 'production' ? null : new Ollama({ host: 'http://localhost:11434' });
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export const processTextToEvent = async (text: string, userTimezone?: string) => {
  console.log('=== NLP Processing Started ===');
  console.log('Input text:', text);
  console.log('User timezone:', userTimezone || 'UTC (default)');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('OpenAI available:', !!openai);
  console.log('Ollama available:', !!ollama);
  console.log('OpenAI API Key set:', !!process.env.OPENAI_API_KEY);
  
  // Get current time in user's timezone or UTC
  const now = new Date();
  const userTimezone = userTimezone || 'UTC';
  
  // Format current time for the prompt
  const currentTime = now.toLocaleString('en-US', { 
    timeZone: userTimezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  const prompt = `You are a calendar event parser. Convert this text to JSON only:

"${text}"

IMPORTANT TIMEZONE CONTEXT:
- User's timezone: ${userTimezone}
- Current time in user's timezone: ${currentTime}
- Always interpret times relative to the user's timezone (${userTimezone})
- Convert all times to UTC in the final JSON output

Rules:
- Return ONLY valid JSON, no explanations
- Use tomorrow's date if "tomorrow" is mentioned (relative to user's timezone)
- Use today's date if "today" is mentioned (relative to user's timezone)
- Default to 2pm in user's timezone if no time specified
- Default to 1 hour duration if not specified
- Extract location from text
- Use proper ISO date format (UTC)
- Convert all times from user's timezone to UTC

Examples (assuming user is in America/New_York):
Input: "gym session tomorrow for 2 hours at the arc gym"
Output: {"title": "Gym Session", "start": "2025-09-08T18:00:00.000Z", "end": "2025-09-08T20:00:00.000Z", "location": "Arc Gym", "description": "Gym session"}

Input: "meeting at 3pm today"
Output: {"title": "Meeting", "start": "2025-09-07T19:00:00.000Z", "end": "2025-09-07T20:00:00.000Z", "location": "TBD", "description": "Meeting"}

Now parse: "${text}"`;

  try {
    // Try OpenAI first (production), then Ollama (local), then fallback
    if (openai) {
      console.log('Using OpenAI for NLP processing...');
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.1
      });
      
      const responseText = response.choices[0]?.message?.content?.trim() || '';
      console.log('OpenAI response received:', responseText);
      
      // Try to parse JSON from OpenAI response
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const eventData = JSON.parse(jsonMatch[0]);
          if (eventData.title && eventData.start && eventData.end) {
            console.log('Successfully parsed OpenAI response:', eventData);
            return eventData;
          }
        } catch (parseError) {
          console.log('Failed to parse OpenAI JSON, using fallback');
        }
      }
    } else if (ollama) {
      console.log('Using Ollama for NLP processing...');
      const response = await ollama.generate({
        model: 'llama3',
        prompt: prompt,
        stream: false
      });

      console.log('Ollama response received:', response.response);
      
      // Try to extract JSON from response
      const responseText = response.response.trim();
      
      // Look for JSON in various formats
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Try to find JSON after "Output:" or similar
        jsonMatch = responseText.match(/Output:\s*(\{[\s\S]*\})/);
        if (jsonMatch) jsonMatch = [jsonMatch[1]];
      }
      
      if (jsonMatch) {
        try {
          const eventData = JSON.parse(jsonMatch[0]);
          console.log('Parsed event data:', eventData);
          
          // Validate required fields
          if (!eventData.title || !eventData.start || !eventData.end) {
            throw new Error('Missing required fields');
          }
          
          return eventData;
        } catch (parseError) {
          console.log('JSON parse error:', parseError);
          throw new Error('Invalid JSON format');
        }
      } else {
        console.log('No JSON found in response, using fallback');
        throw new Error('No JSON found in response');
      }
    } else {
      console.log('No NLP service available, using smart fallback...');
      return createSmartFallback(text, userTimezone);
    }
  } catch (error) {
    console.error('NLP processing error:', error);
    // Smart fallback - try to extract basic info from the original text
    const fallbackData = createSmartFallback(text, userTimezone);
    console.log('Using smart fallback data:', fallbackData);
    return fallbackData;
  }
};

const createSmartFallback = (text: string, userTimezone?: string) => {
  console.log('Creating smart fallback for text:', text);
  console.log('User timezone for fallback:', userTimezone || 'UTC (default)');
  
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Validate base dates
    if (isNaN(now.getTime()) || isNaN(tomorrow.getTime())) {
      console.log('Invalid base dates, using current time');
      const fallbackNow = new Date();
      const fallbackTomorrow = new Date(fallbackNow.getTime() + 24 * 60 * 60 * 1000);
      return {
        title: 'Event',
        start: fallbackNow.toISOString(),
        end: fallbackTomorrow.toISOString(),
        location: 'TBD',
        description: text
      };
    }
  
  // Extract title from text - multiple patterns
  let title = 'Event';
  
  // Pattern 1: Simple "do X" format
  const doPattern = text.match(/^(?:i\s+)?(?:want\s+to\s+)?(?:need\s+to\s+)?(?:have\s+to\s+)?(?:should\s+)?(?:can\s+)?(?:will\s+)?(?:do\s+)?([a-zA-Z\s]+?)(?:\s+(?:tomorrow|today|at|for|hours?|minutes?|pm|am|\d+|\d+:\d+)|\s*$)/i);
  if (doPattern && doPattern[1].trim().length > 0) {
    title = doPattern[1].trim();
  }
  
  // Pattern 2: "X meeting/appointment/session" format
  const meetingPattern = text.match(/([a-zA-Z\s]+?)\s+(?:meeting|appointment|session|call|conference|interview|lunch|dinner|breakfast|workout|gym|class|lesson|training|workshop|seminar)/i);
  if (meetingPattern && meetingPattern[1].trim().length > 0) {
    title = `${meetingPattern[1].trim()} ${meetingPattern[0].split(' ').pop()}`;
  }
  
  // Pattern 3: Generic word extraction
  if (title === 'Event') {
    const words = text.split(' ').filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'with', 'at', 'in', 'on', 'to', 'of', 'a', 'an'].includes(word.toLowerCase()) &&
      !word.match(/^\d+$/) &&
      !word.match(/^(am|pm|hours?|minutes?)$/i)
    );
    if (words.length > 0) {
      title = words.slice(0, 3).join(' ');
    }
  }
  
  // Capitalize title
  title = title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  // Extract duration - multiple patterns
  let durationHours = 1;
  const durationPatterns = [
    /(\d+)\s*(?:hours?|hrs?|hour)/i,
    /for\s+(\d+)\s*(?:hours?|hrs?|hour)/i,
    /(\d+)\s*(?:hour|hr)\s+(?:long|duration)/i
  ];
  
  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      durationHours = parseInt(match[1]);
      break;
    }
  }
  
  // Extract location - multiple patterns
  let location = 'TBD';
  const locationPatterns = [
    /(?:at|@|in)\s+([a-zA-Z0-9\s]+?)(?:\s+(?:tomorrow|today|hours?|minutes?|pm|am|\d+)|\s|$)/i,
    /(?:meeting|appointment|session|call|conference|interview|lunch|dinner|breakfast|workout|gym|class|lesson|training|workshop|seminar)\s+(?:at|@|in)\s+([a-zA-Z0-9\s]+?)(?:\s|$)/i,
    /(?:go\s+to|visit|see)\s+([a-zA-Z0-9\s]+?)(?:\s|$)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1].trim().length > 0) {
      location = match[1].trim();
      break;
    }
  }
  
  // Determine date - improved logic
  let eventDate = tomorrow;
  const textLower = text.toLowerCase();
  
  if (textLower.includes('today')) {
    eventDate = now;
  } else if (textLower.includes('tomorrow')) {
    eventDate = tomorrow;
  } else if (textLower.includes('next week')) {
    eventDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else if (textLower.includes('this week')) {
    eventDate = now;
  }
  
  // Determine time - improved regex with multiple patterns
  let eventTime = new Date(eventDate);
  
  // Validate the base date first
  if (isNaN(eventTime.getTime())) {
    console.log('Invalid base date, using current time');
    eventTime = new Date();
  }
  
  eventTime.setHours(14, 0, 0, 0); // Default to 2pm
  
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
    /(\d{1,2})\s*(am|pm)/i,
    /at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i,
    /(\d{1,2})\s*(?:o'clock|oclock)/i
  ];
  
  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const ampm = match[3]?.toLowerCase();
      
      // Validate hours and minutes
      if (isNaN(hours) || hours < 0 || hours > 23) {
        console.log('Invalid hours, skipping time pattern');
        continue;
      }
      if (isNaN(minutes) || minutes < 0 || minutes > 59) {
        console.log('Invalid minutes, skipping time pattern');
        continue;
      }
      
      if (ampm === 'pm' && hours !== 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      
      // Validate final hours
      if (hours < 0 || hours > 23) {
        console.log('Invalid final hours, skipping time pattern');
        continue;
      }
      
      eventTime.setHours(hours, minutes, 0, 0);
      break;
    }
  }
  
  // Validate the final event time
  if (isNaN(eventTime.getTime())) {
    console.log('Invalid event time, using current time + 1 hour');
    eventTime = new Date();
    eventTime.setHours(eventTime.getHours() + 1, 0, 0, 0);
  }
  
  const endTime = new Date(eventTime.getTime() + durationHours * 60 * 60 * 1000);
  
  // Validate the end time
  if (isNaN(endTime.getTime())) {
    console.log('Invalid end time, using event time + 1 hour');
    endTime.setTime(eventTime.getTime() + 60 * 60 * 1000);
  }
  
    const result = {
      title: title,
      start: eventTime.toISOString(),
      end: endTime.toISOString(),
      location: location,
      description: text
    };
    
    console.log('Smart fallback result:', result);
    return result;
    
  } catch (error) {
    console.error('Error in createSmartFallback:', error);
    // Ultimate fallback - return a safe default
    const safeDate = new Date();
    const safeEndDate = new Date(safeDate.getTime() + 60 * 60 * 1000); // 1 hour later
    
    return {
      title: 'Event',
      start: safeDate.toISOString(),
      end: safeEndDate.toISOString(),
      location: 'TBD',
      description: text
    };
  }
};
