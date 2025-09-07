import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://localhost:11434' });

export const processTextToEvent = async (text: string) => {
  const prompt = `
    Convert this natural language text into a calendar event:
    "${text}"
    
    Return a JSON object with:
    - title: Event title
    - start: Start time (ISO string)
    - end: End time (ISO string)
    - location: Location if mentioned
    - description: Description
    
    If no specific time is mentioned, suggest tomorrow at 2pm.
    If no duration is mentioned, assume 1 hour.
    
    Examples:
    - "Gym session, 2 hours, arc gym location" -> {"title": "Gym Session", "start": "2024-09-08T10:00:00.000Z", "end": "2024-09-08T12:00:00.000Z", "location": "Arc Gym", "description": "Gym session"}
    - "Meeting tomorrow at 2pm" -> {"title": "Meeting", "start": "2024-09-08T14:00:00.000Z", "end": "2024-09-08T15:00:00.000Z", "location": "TBD", "description": "Meeting"}
  `;

  try {
    const response = await ollama.generate({
      model: 'llama3',
      prompt: prompt,
      stream: false
    });

    // Try to extract JSON from response
    const responseText = response.response;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const eventData = JSON.parse(jsonMatch[0]);
      return eventData;
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    console.error('Ollama processing error:', error);
    // Fallback if JSON parsing fails
    return {
      title: 'Meeting',
      start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      location: 'TBD',
      description: text
    };
  }
};
