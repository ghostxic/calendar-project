import { Ollama } from 'ollama';
import OpenAI from 'openai';

// Initialize services based on environment
const ollama = process.env.NODE_ENV === 'production' ? null : new Ollama({ host: 'http://localhost:11434' });
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export const processTextToEvent = async (text: string) => {
  const prompt = `You are a calendar event parser. Convert this text to JSON only:

"${text}"

Rules:
- Return ONLY valid JSON, no explanations
- Use tomorrow's date if "tomorrow" is mentioned
- Use today's date if "today" is mentioned  
- Default to 2pm if no time specified
- Default to 1 hour duration if not specified
- Extract location from text
- Use proper ISO date format

Examples:
Input: "gym session tomorrow for 2 hours at the arc gym"
Output: {"title": "Gym Session", "start": "2025-09-08T14:00:00.000Z", "end": "2025-09-08T16:00:00.000Z", "location": "Arc Gym", "description": "Gym session"}

Input: "meeting at 3pm today"
Output: {"title": "Meeting", "start": "2025-09-07T15:00:00.000Z", "end": "2025-09-07T16:00:00.000Z", "location": "TBD", "description": "Meeting"}

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
      return createSmartFallback(text);
    }
  } catch (error) {
    console.error('Ollama processing error:', error);
    // Smart fallback - try to extract basic info from the original text
    const fallbackData = createSmartFallback(text);
    console.log('Using smart fallback data:', fallbackData);
    return fallbackData;
  }
};

const createSmartFallback = (text: string) => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  // Extract title from text
  let title = 'Event';
  const titleMatch = text.match(/(?:^|\s)([a-zA-Z\s]+?)(?:\s+(?:for|at|tomorrow|today|hours?|minutes?|pm|am)|\s+\d+|\s+hours?|\s+minutes?|$)/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
    // Capitalize first letter of each word
    title = title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  
  // Extract duration
  let durationHours = 1;
  const durationMatch = text.match(/(\d+)\s*(?:hours?|hrs?)/i);
  if (durationMatch) {
    durationHours = parseInt(durationMatch[1]);
  }
  
  // Extract location
  let location = 'TBD';
  const locationMatch = text.match(/(?:at|@)\s+([a-zA-Z\s]+?)(?:\s|$)/i);
  if (locationMatch) {
    location = locationMatch[1].trim();
  }
  
  // Determine date
  let eventDate = tomorrow;
  if (text.toLowerCase().includes('today')) {
    eventDate = now;
  }
  
  // Determine time
  let eventTime = new Date(eventDate);
  eventTime.setHours(14, 0, 0, 0); // Default to 2pm
  
  const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = timeMatch[3]?.toLowerCase();
    
    if (ampm === 'pm' && hours !== 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    
    eventTime.setHours(hours, minutes, 0, 0);
  }
  
  const endTime = new Date(eventTime.getTime() + durationHours * 60 * 60 * 1000);
  
  return {
    title: title,
    start: eventTime.toISOString(),
    end: endTime.toISOString(),
    location: location,
    description: text
  };
};
