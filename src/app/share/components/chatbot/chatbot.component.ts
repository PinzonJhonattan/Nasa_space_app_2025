import { Component, Input, ViewChild, ElementRef, AfterViewChecked, signal, effect, OnDestroy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, ChatMessage } from './services/gemini.service';
import { ChatSessionService, ChatContext } from './services/chat-session.service';
import { LocationService, LocationInfo } from './services/location.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, NgIf, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit, OnChanges, AfterViewChecked, OnDestroy {
  @Input() weatherData: any = null;
  @Input() date: Date | null = null;
  @Input() startTime: string = '';
  @Input() endTime: string = '';
  @Input() activity: string = 'caminata';
  @Input() probabilities: any[] = [];
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  private destroy$ = new Subject<void>();

  // Signals
  isOpen = signal<boolean>(false);
  messages = signal<ChatMessage[]>([]);
  isTyping = signal<boolean>(false);
  locationInfo = signal<LocationInfo | null>(null);
  locationSuggestions = signal<string[]>([]);

  // Properties
  currentMessage = '';
  quickSuggestions = [
    'How will the weather look?',
    'Should I cancel my activity?',
    'What should I wear?',
    'When is the best time?'
  ];

  constructor(
    private geminiService: GeminiService,
    private chatSessionService: ChatSessionService,
    private locationService: LocationService
  ) {
    // Subscribe to chat session service messages
    this.chatSessionService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages.set(messages);
      });
  }

  ngOnInit() {
    console.log('ChatBot ngOnInit - coordinates:', this.latitude, this.longitude);

    // Probar conectividad con Gemini (temporal para debugging)
    this.testGeminiConnection();

    // Inicializar el chat si hay datos disponibles
    if (this.weatherData && this.date) {
      this.handleContextChange();
    }

    // Fetch location info when coordinates are available
    if (this.latitude && this.longitude) {
      console.log('Loading location info...');
      this.loadLocationInfo();
    } else {
      console.log('No coordinates available, using default suggestions');
      // Generate suggestions even without a specific location
      this.generateLocationSuggestions(null);
    }

    // Generate suggestions when location data is already available
    if (this.locationInfo()) {
      console.log('Location info already available, generating suggestions');
      this.generateLocationSuggestions(this.locationInfo());
    }
  }

  // Temporary helper to test Gemini
  private testGeminiConnection() {
    console.log('Testing Gemini connectivity...');
    this.geminiService.testConnection()
      .subscribe({
        next: (response) => {
          console.log('Gemini connected successfully:', response);
        },
        error: (error) => {
          console.error('Gemini connectivity error:', error);
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Update location info whenever the coordinates change
    if (changes['latitude'] || changes['longitude']) {
      if (this.latitude && this.longitude) {
        this.loadLocationInfo();
      }
    }

    // Only process changes when all required data is present
    if (this.weatherData && this.date &&
        (changes['weatherData'] || changes['date'] || changes['activity'] || changes['startTime'] || changes['endTime'] || changes['latitude'] || changes['longitude'])) {
      this.handleContextChange();
    }
  }

  ngAfterViewChecked() {
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get hasWeatherData(): boolean {
    return !!this.weatherData;
  }

  // Para debugging
  get debugInfo() {
    return {
      hasLocationInfo: !!this.locationInfo(),
      locationInfo: this.locationInfo(),
      suggestionCount: this.locationSuggestions().length,
      suggestions: this.locationSuggestions()
    };
  }

  private loadLocationInfo() {
    if (!this.latitude || !this.longitude) return;

    this.locationService.getLocationInfo(this.longitude, this.latitude)
      .pipe(takeUntil(this.destroy$))
      .subscribe(location => {
        this.locationInfo.set(location);
        this.generateLocationSuggestions(location);
      });
  }

  private generateLocationSuggestions(location: LocationInfo | null) {
    console.log('Generating location suggestions:', location);

    const suggestions = [...this.quickSuggestions];

    this.locationSuggestions.set(suggestions);
    console.log('Suggestions ready:', suggestions);
  }

  toggleChat() {
    this.isOpen.update(value => !value);

    if (this.isOpen() && this.messageInput) {
      setTimeout(() => {
        this.messageInput.nativeElement.focus();
      }, 100);
    }
  }

  private handleContextChange() {
    if (!this.weatherData || !this.date) return;

    const newContext: ChatContext = {
      activity: this.activity,
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
      weatherData: this.weatherData,
      probabilities: this.probabilities,
      locationInfo: this.locationInfo()
    };

    const contextChanged = this.chatSessionService.updateContext(newContext);

    // Reset the chat automatically when the context changes
    if (contextChanged) {
      this.initializeChat();
    } else if (this.chatSessionService.getMessages().length === 0) {
      // Only initialize if there are no messages and the context did not change
      this.initializeChat();
    }
  }

  private initializeChat() {
    if (!this.weatherData || !this.date) return;

    const info = this.locationInfo();
    const locationPieces = info ? [info.city, info.country].filter(part => part && !part.toLowerCase().includes('unknown')) : [];
    const locationText = locationPieces.length ? ` in ${locationPieces.join(', ')}` : '';

    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: `Hello! I have the latest weather outlook for your ${this.activity}${locationText} on ${this.formatDate(this.date)} from ${this.startTime} to ${this.endTime}. How can I help?`,
      timestamp: new Date()
    };

    this.chatSessionService.setMessages([welcomeMessage]);
  }


  sendMessage() {
    if (!this.currentMessage.trim() || this.isTyping()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: this.currentMessage.trim(),
      timestamp: new Date()
    };

    // Add the user message
    this.chatSessionService.addMessage(userMessage);

    // Reset the input field
    const messageText = this.currentMessage;
    this.currentMessage = '';

    // Process the AI response
    this.processAIResponse(messageText);
  }

  sendQuickMessage(suggestion: string) {
    this.currentMessage = suggestion;
    this.sendMessage();
  }

  private processAIResponse(userMessage: string) {
    this.isTyping.set(true);

    // Use the component data directly instead of extra service calls
    if (!this.weatherData || !this.date) {
      this.isTyping.set(false);
      return;
    }

    const currentMessages = this.chatSessionService.getMessages();

    // Build the system context for Gemini
    const systemContext = this.geminiService.createWeatherContext(
      this.weatherData,
      this.date,
      this.startTime,
      this.endTime,
      this.activity,
      this.probabilities,
      currentMessages
    );

    // Prepare the conversation payload for the API
    const apiMessages: ChatMessage[] = [
      { role: 'system', content: systemContext },
      ...currentMessages.slice(-5), // Last 5 messages for context
    ];

    this.geminiService.sendMessage(apiMessages)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const botMessage: ChatMessage = {
            role: 'assistant',
            content: response.choices[0].message.content,
            timestamp: new Date()
          };

          this.chatSessionService.addMessage(botMessage);
          this.isTyping.set(false);
        },
        error: (error) => {
          console.error('Error while getting a response from Gemini:', error);

          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: 'Sorry, something went wrong while processing your message. Please try again.',
            timestamp: new Date()
          };

          this.chatSessionService.addMessage(errorMessage);
          this.isTyping.set(false);
        }
      });
  }


  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  /**
   * Converts basic Markdown into HTML for rendering in the chat
   */
  formatMessage(content: string): string {
    if (!content) return '';

    return content
      // Convert **text** into <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert *text* into <em>text</em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert line breaks to <br>
      .replace(/\n/g, '<br>')
      // Convert unordered lists with * into <ul><li>
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // Convert unordered lists with - into <ul><li>
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // Convert numbered lists
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
  }
}

