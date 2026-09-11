import { Injectable } from '@angular/core';
import { HubConnection,HubConnectionBuilder} from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface TranscriptionMessage {
  type: 'interim' | 'final';
  content: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranscriptionHubService {
  private hubConnection: HubConnection | undefined;
  private messageSubject = new BehaviorSubject<TranscriptionMessage | null>(null);
  private statusSubject = new BehaviorSubject<string>('disconnected');

  constructor() {}

  public get messages(): Observable<TranscriptionMessage | null> {
    return this.messageSubject.asObservable();
  }

  public get connectionStatus(): Observable<string> {
    return this.statusSubject.asObservable();
  }

  public async startConnection(): Promise<void> {
    try {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(`${environment.apiBaseUrl}/transcriptionHub`)
        .withAutomaticReconnect()
        .build();

      await this.hubConnection.start();
      this.statusSubject.next('connected');
      this.setupMessageHandlers();
      console.log('Transcription Hub Connected');
    } catch (err) {
      console.error('Error starting transcription hub:', err);
      this.statusSubject.next('error');
      throw err;
    }
  }

  private setupMessageHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('ReceiveTranscription', (transcription: string, isInterim: boolean) => {
      this.messageSubject.next({
        type: isInterim ? 'interim' : 'final',
        content: transcription,
        timestamp: new Date().toISOString()
      });
    });

    this.hubConnection.onreconnecting(() => {
      this.statusSubject.next('reconnecting');
    });

    this.hubConnection.onreconnected(() => {
      this.statusSubject.next('connected');
    });

    this.hubConnection.onclose(() => {
      this.statusSubject.next('disconnected');
    });
  }

  public async sendAudioChunk(audioBlob: Blob): Promise<void> {
    if (!this.hubConnection) throw new Error('No connection to server');

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      await this.hubConnection.invoke('ProcessAudioChunk', base64data);
    } catch (error) {
      console.error('Error sending audio chunk:', error);
      throw error;
    }
  }

  public async stopTranscription(): Promise<void> {
    if (!this.hubConnection) return;
    try {
      await this.hubConnection.invoke('StopTranscription');
    } catch (error) {
      console.error('Error stopping transcription:', error);
    }
  }
}