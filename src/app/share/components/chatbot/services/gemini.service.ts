import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ActivityConfigService } from '../../../services/activity-config.service';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface GeminiResponse {
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
}
@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiUrl = environment.geminiApiUrl;
  private apiKey = environment.geminiApiKey;

  constructor(
    private http: HttpClient,
    private activityConfigService: ActivityConfigService
  ) {}

  // Test helper to verify Gemini connectivity
  testConnection(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    let params = new HttpParams().set('key', this.apiKey);

    const testBody = {
      contents: [{
        parts: [{
          text: 'Hello, this is a test. Reply with "Connection successful".'
        }]
      }]
    };

    console.log('Testing Gemini connection...');
    return this.http.post<any>(this.apiUrl, testBody, { headers, params })
      .pipe(
        map((response: any) => {
          console.log('Test response:', response);
          return response;
        }),
        catchError((error) => {
          console.error('Test failed:', error);
          throw error;
        })
      );
  }

  sendMessage(messages: any[]): Observable<GeminiResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    let params = new HttpParams().set('key', this.apiKey);

    // Simplificar el manejo de mensajes para Gemini
    const systemMessage = messages.find(msg => msg.role === 'system');
    const userMessages = messages.filter(msg => msg.role === 'user');

    // Si hay contexto del sistema y mensaje del usuario, combinarlos
    let finalPrompt = '';
    if (systemMessage && userMessages.length > 0) {
      finalPrompt = `${systemMessage.content}\n\n---\n\nPregunta del usuario: ${userMessages[userMessages.length - 1].content}`;
    } else if (userMessages.length > 0) {
      finalPrompt = userMessages[userMessages.length - 1].content;
    } else if (systemMessage) {
      finalPrompt = systemMessage.content;
    } else {
      finalPrompt = 'How will the weather be?';
    }

    const body = {
      contents: [{
        parts: [{
          text: finalPrompt
        }]
      }]
    };

    console.log('Sending to Gemini:', {
      body,
      url: this.apiUrl,
      apiKey: this.apiKey.substring(0, 10) + '...', // Solo mostrar parte de la key
      headers: headers,
      params: params.toString()
    });

    // Verificar si la API key existe
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('Gemini API key is not configured');
    }

    return this.http.post<any>(this.apiUrl, body, { headers, params })
      .pipe(
        map((geminiResponse: any) => {
          console.log('Gemini Response:', geminiResponse);

          // Verificar si hay errores en la respuesta
          if (geminiResponse.error) {
            console.error('Gemini API Error:', geminiResponse.error);
            throw new Error(`Gemini API Error: ${geminiResponse.error.message}`);
          }

          // Verificar si hay candidatos
          if (!geminiResponse.candidates || geminiResponse.candidates.length === 0) {
            console.error('No candidates in response:', geminiResponse);
            throw new Error('No valid response was received from Gemini');
          }

          const text = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process your request.';

          return {
            choices: [{
              message: {
                role: 'assistant',
                content: text
              }
            }]
          };
        }),
        catchError((error) => {
          console.error('Error completo de Gemini:', error);
          console.error('Error status:', error.status);
          console.error('Error statusText:', error.statusText);
          console.error('Error response:', error.error);
          console.error('Error URL:', error.url);

          // Add specific diagnostics for 404 responses
          if (error.status === 404) {
            console.error('Error 404: Check the API URL and API key');
            console.error('Requested URL:', this.apiUrl);
            console.error('Parameters:', params.toString());
          }

          throw error;
        })
      );
  }

  createWeatherContext(weatherData: any, date: Date, startTime: string, endTime: string, activity: string, probabilities: any[], recentMessages: ChatMessage[]): string {
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Retrieve the most specific context available for the activity
    let activityContext = this.activityConfigService.getActivityChatbotContextByTitle(activity);
    if (!activityContext) {
      activityContext = this.activityConfigService.getActivityChatbotContext(activity);
    }

    const avgTemp = weatherData.temp.reduce((a: number, b: number) => a + b, 0) / weatherData.temp.length;
    const maxTemp = Math.max(...weatherData.temp);
    const minTemp = Math.min(...weatherData.temp);
    const avgHumidity = weatherData.humidity.reduce((a: number, b: number) => a + b, 0) / weatherData.humidity.length;
    const avgWind = weatherData.wind.reduce((a: number, b: number) => a + b, 0) / weatherData.wind.length;
    const maxWind = Math.max(...weatherData.wind);
    const totalPrecip = weatherData.precipitation.reduce((a: number, b: number) => a + b, 0);

    const highProbabilities = probabilities.filter(p => p.percentage > 30);
    const probabilitySummary = highProbabilities.length > 0
      ? highProbabilities
          .map(p => `- ${p.label}: ${p.percentage.toFixed(0)}% chance during the selected period`)
          .join('\n')
      : '- Generally comfortable conditions with no major risk factors.';

    const recentConversation = recentMessages
      .filter(message => message.role !== 'system')
      .slice(-4)
      .map(message => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
      .join('\n');
    const conversationSection = recentConversation
      ? `
RECENT CONVERSATION (newest last):
${recentConversation}
`
      : '';



    return `
INTELLIGENT WEATHER ANALYSIS FOR ${activityContext.toUpperCase()}:

CRITICAL INSTRUCTIONS:
1. ANALYZE the forecast specifically for ${activityContext}.
2. DETERMINE whether the activity is RECOMMENDED, REQUIRES CAUTION, or SHOULD BE POSTPONED.
3. ACCOUNT for the unique aspects of this activity (for example, fishing needs calm wind, flights are wind-sensitive).
4. PROVIDE a clear recommendation at the beginning (e.g., [Recommended], [Use Caution], [Not Recommended]).

WEATHER SNAPSHOT:
- Date and time: ${dateStr}, ${startTime} - ${endTime}
- Temperature: average ${avgTemp.toFixed(1)} deg C (range ${minTemp.toFixed(1)} - ${maxTemp.toFixed(1)} deg C)
- Wind: average ${avgWind.toFixed(1)} km/h (max ${maxWind.toFixed(1)} km/h)
- Humidity: average ${avgHumidity.toFixed(1)}%
- Expected precipitation: ${totalPrecip.toFixed(1)} mm total

COMFORT AND RISK FACTORS:
${probabilitySummary}

ACTIVITY CONTEXT:
This request focuses on ${activityContext}. Keep in mind:
${this.getActivityConsiderations(activity)}
${conversationSection}
RESPONSE FORMAT:
- Start with an emoji-based recommendation label (use ✅ for Recommended, ⚠️ for Use Caution, ❌ for Not Recommended).
- Refer back to the latest user prompt so the reply feels like a natural continuation.
- Summarize the reasoning in 2-3 friendly sentences.
- Offer concrete, activity-specific tips in a short paragraph or concise bullets (avoid repeating identical lead-ins such as "Avoid" twice in a row).
- Include a quick gear paragraph (for example, "Pack ..." / "Skip ...") that sounds conversational rather than robotic.
- If you only have data for the requested window, invite the user to share a different time instead of saying you lack data, and avoid phrases like "Based only on the provided forecast".
- Keep the tone conversational but precise.

Provide the response in English with a helpful, friendly tone.
`;
  }

  private getActivityConsiderations(activity: string): string {
    // Determine if this is a custom activity (first by title, then by ID)
    const isCustomByTitle = this.activityConfigService.isCustomActivityByTitle(activity);
    const isCustomById = this.activityConfigService.isCustomActivity(activity);

    if (isCustomByTitle || isCustomById) {
      let activityContext = this.activityConfigService.getActivityChatbotContextByTitle(activity);
      if (!activityContext) {
        activityContext = this.activityConfigService.getActivityChatbotContext(activity);
      }
      return `- This is a custom activity: ${activityContext}
- Evaluate according to the usual requirements for this activity
- Consider specific safety and comfort factors`;
    }

    // Predefined activities
    switch (activity.toLowerCase()) {
      case 'caminata':
        return [
          '- Sensitive to extreme temperatures and rain',
          '- Wind changes the perceived temperature',
          '- Requires good visibility'
        ].join('\n');

      case 'pesca':
        return [
          '- Highly sensitive to wind (casting and navigation become difficult)',
          '- Rain can reduce fish activity',
          '- Moderate temperatures are ideal'
        ].join('\n');

      case 'natacion':
        return [
          '- Needs warm air and water (18 deg C or higher)',
          '- Sensitive to strong wind and rain',
          '- Humidity is not a limiting factor'
        ].join('\n');

      case 'vuelos':
        return [
          '- Very sensitive to wind (above 15 km/h is problematic)',
          '- Rain reduces visibility and impacts operations',
          '- Extreme temperatures can generate delays'
        ].join('\n');

      case 'ganaderia':
        return [
          '- Livestock struggles with extreme temperatures (< -5 deg C or > 38 deg C)',
          '- Strong winds create stress',
          '- Excessive rain affects grazing areas'
        ].join('\n');

      case 'navegacion':
        return [
          '- Very sensitive to wind (above 20 km/h is risky)',
          '- Rain lowers visibility',
          '- Moderate temperatures are safest'
        ].join('\n');

      case 'camping':
        return [
          '- Temperatures below 5 deg C demand specialized gear',
          '- Winds above 25 km/h compromise tents',
          '- Rain can quickly ruin the experience'
        ].join('\n');

      case 'riego':
        return [
          '- Avoid irrigation during heavy rain (> 5 mm)',
          '- Strong wind scatters the water',
          '- Very hot conditions speed up evaporation'
        ].join('\n');

      case 'carretera':
        return [
          '- Rain reduces traction and visibility',
          '- Strong crosswinds are dangerous',
          '- Extreme temperatures affect vehicles and tires'
        ].join('\n');

      case 'eventos':
        return [
          '- Outdoor events are vulnerable to rain',
          '- Moderate winds can already be disruptive',
          '- Extreme temperatures reduce attendee comfort'
        ].join('\n');

      case 'playa':
        return [
          '- Prefers warm weather (20 deg C or higher)',
          '- Strong wind produces dangerous surf',
          '- Rain spoils the beach experience'
        ].join('\n');

      default:
        return [
          '- Evaluate according to the typical requirements for this activity',
          '- Consider safety and comfort factors'
        ].join('\n');
    }
  }
}

