import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatMessage } from './gemini.service';
import { LocationInfo } from './location.service';

export interface ChatContext {
  activity: string;
  date: Date | null;
  startTime: string;
  endTime: string;
  weatherData: any;
  probabilities: any[];
  locationInfo: LocationInfo | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChatSessionService {
  private currentContextSubject = new BehaviorSubject<ChatContext | null>(null);
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private sessionIdSubject = new BehaviorSubject<string>('');

  public currentContext$ = this.currentContextSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public sessionId$ = this.sessionIdSubject.asObservable();

  constructor() {
    this.generateSessionId();
  }

  private generateSessionId(): void {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionIdSubject.next(sessionId);
  }

  updateContext(newContext: ChatContext): boolean {
    const currentContext = this.currentContextSubject.value;

    if (!currentContext) {
      this.currentContextSubject.next(newContext);
      return false;
    }

    const contextChanged = this.hasContextChanged(currentContext, newContext);

    if (contextChanged) {
      this.currentContextSubject.next(newContext);
      this.generateSessionId();
      // Clear messages when the context changes for dynamic chat
      this.clearMessages();
      return true;
    }

    return false;
  }

  private hasContextChanged(oldContext: ChatContext, newContext: ChatContext): boolean {
    return (
      oldContext.activity !== newContext.activity ||
      oldContext.date?.getTime() !== newContext.date?.getTime() ||
      oldContext.startTime !== newContext.startTime ||
      oldContext.endTime !== newContext.endTime ||
      this.hasLocationChanged(oldContext.locationInfo, newContext.locationInfo)
    );
  }

  private hasLocationChanged(oldLocation: LocationInfo | null, newLocation: LocationInfo | null): boolean {
    if (!oldLocation && !newLocation) return false;
    if (!oldLocation || !newLocation) return true;

    return (
      Math.abs(oldLocation.latitude - newLocation.latitude) > 0.0001 ||
      Math.abs(oldLocation.longitude - newLocation.longitude) > 0.0001
    );
  }

  setMessages(messages: ChatMessage[]): void {
    this.messagesSubject.next(messages);
  }

  getMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  addMessage(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  getCurrentContext(): ChatContext | null {
    return this.currentContextSubject.value;
  }

  getSessionId(): string {
    return this.sessionIdSubject.value;
  }

  resetSession(): void {
    this.clearMessages();
    this.generateSessionId();
  }
}
