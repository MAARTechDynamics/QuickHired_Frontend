import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, NgZone, ElementRef, ViewChild, AfterViewInit, OnInit, ChangeDetectorRef, OnDestroy, Injectable } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment';
declare var bootstrap: any;
import { IdleTimeOutService } from '../idle-time-out-service';
import { TranscriptionHubService } from '../services/transcription-hub.service';
import { Subscription } from 'rxjs';
interface Mood {
  icon: string;
  text: string;
}


@Component({
  selector: 'app-mock-interview',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './mock-interview.component.html',
  styleUrl: './mock-interview.component.css'
})


export class MockInterviewComponent implements OnInit, OnDestroy {
  currentQuestionText: string = ''; 
  currentAnswerText: string = '';
  interimAnswerText: string = '';
  lastQuestionAsked: string = '';
  
  private transcriptionSub: Subscription | undefined;
  private mediaStream: MediaStream | null = null;
  private processorNode: any = null;
  private audioContext: AudioContext | null = null;
  private speechRecognition: any = null;
  private silenceTimer: any = null;
  private noiseCheckInterval: any = null;
  private audioAnalyser: AnalyserNode | null = null;
  private lastSpeechTime: number = 0;
  isPlayingTransition: boolean = false;
  isInterviewerSpeaking: boolean = false;
  
  currentQuestion: string = '';
  audioUrl: string = '';
  isLoading: boolean = false;
  questionNumber: number = 1;
  interviewStarted: boolean = false;
  isMobile: boolean = false;
  isSafari: boolean = false;
  userAnswer: string = '';
  answers: { question: string, answer: string }[] = [];
  mediaRecorder: any;
  audioChunks: Blob[] = [];
  isRecording: boolean = false;
  userEmail: string = 'user@example.com';
  avatarVideoUrl: string = '/assets/logos/LatestVideo.mp4';
  timestamp: string = '';
  // Avatar video segment control (seconds)
  // When the interviewer is speaking, loop 20s–50s
  private TALK_START: number = 20;
  private TALK_END: number = 50;
  // When listening to the user, loop 7s–10s (calmer motion)
  private LISTEN_START: number = 7;
  private LISTEN_END: number = 10;
  private listenLoopInterval: any = null;
  // Barge-in detection (speak mid-question)
  private bargeInStream: MediaStream | null = null;
  private bargeInAnalyser: AnalyserNode | null = null;
  private bargeInInterval: any = null;
  private bargeInActive: boolean = false;
  
  // Natural transitions
  transitionPhrases: string[] = [
    "Thanks for sharing that",
    "I appreciate your answer",
    "That's interesting",
    "I see, that makes sense",
    "Great, thank you",
    "Alright, got it",
    "Perfect, thanks",
    "Okay, I understand"
  ];
  
  noiseThreshold: number = 50; // Noise level threshold (0-100)
  silenceThreshold: number = 1200; // Faster auto-advance: ~1.2s of silence
  currentUserEmail: string | null = null;
  sessionTime: number | null = null;
  startTime!: Date;
  isQuestionTyping = false;
  isAnswerTyping = false;
  typedUserAnswer: string = '';
  userId: string = "";
  private userApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster`;
  private isUserAtBottom = true;

   

  @ViewChild('scrollContainer', { static: false }) private scrollContainer!: ElementRef;

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.scrollContainer) {
        console.log(this.scrollContainer); 
        this.scrollToBottom();
      }
    }, 0); 
    if (this.avatarVideoRef?.nativeElement) {
          this.avatarVideoRef.nativeElement.muted = true;
    }
  }
  
 

  private checkScrollPosition(): void {
    const el = this.scrollContainer.nativeElement;
    const threshold = 80; // px from bottom
    const position = el.scrollTop + el.clientHeight;
    const height = el.scrollHeight;
  
    this.isUserAtBottom = position >= height - threshold;
  }
  
  ngAfterViewChecked() {
    this.cdr.detectChanges();
    if (this.scrollContainer) {
      console.log(this.scrollContainer);
      this.scrollToBottom();
    }
  }
   
  scrollToBottom(): void {
    const element = this.scrollContainer.nativeElement;
    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth'
    });
  }
  
  @ViewChild('avatarVideo') avatarVideoRef!: ElementRef<HTMLVideoElement>;
  
  ngOnInit(): void {
    
    this.loadCurrentUser();
    this.route.queryParams.subscribe(params => {
      this.sessionTime = +params['time'] || null;
      console.log('Session Duration:', this.sessionTime);
    });
    if (this.sessionTime) {
      setTimeout(() => {
        this.stopInterview();
        this.showSessionExpiredAlert();
      }, this.sessionTime * 60000);
    }
  };
  constructor(
    private http: HttpClient, 
    private zone: NgZone,
    private route: ActivatedRoute,
    private router: Router, 
    private cdr: ChangeDetectorRef,
    private idleService: IdleTimeOutService,
    private transcriptionHub: TranscriptionHubService
  ) {
    // Initialize mobile detection
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    // Detect Safari browser
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    // Initialize audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async ngOnDestroy() {
    // Clean up resources
    this.stopRecording();
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.processorNode) {
      this.processorNode.disconnect();
    }
    if (this.audioContext) {
      await this.audioContext.close();
    }
    this.transcriptionSub?.unsubscribe();
  }

  async startInterview() {
  this.idleService.pauseTimeout();

  this.startTime = new Date();
  this.interviewStarted = true;
  this.elapsedSeconds = 0;
  this.answers = []; // Interview start  history empty
 
  // Show warm greeting
  await this.showWarmGreeting();
  
  this.startDurationTimer(); 
  await this.getMockQuestion();
  
  // Request fullscreen on mobile for better view
  if (this.isMobile) {
    this.requestFullscreen();
  }
}

async showWarmGreeting() {
  const greetings = [
    "Hi there! I'm excited to get to know you better today. Let's have a great conversation!",
    "Hello! Thanks for joining me. I'm looking forward to learning more about your experience.",
    "Hey! Great to meet you. Let's dive in and have a productive discussion.",
    "Welcome! I'm glad you're here. Let's make this interview comfortable and insightful."
  ];
  
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  return new Promise<void>((resolve) => {
    Swal.fire({
      icon: 'success',
      title: '👋 Welcome to Your Interview',
      html: `<p style="font-size: 16px; line-height: 1.6;">${greeting}</p>`,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false
    }).then(() => resolve());
  });
}

getMockQuestion() {
  this.isLoading = true;
  this.resetCurrentQA();

  this.http.post<any>(`${environment.apiBaseUrl}/api/AIInterview/mock-question`, {})
    .subscribe({
      next: async (res) => {
        await this.handleQuestionResponse(res);
      },
      error: (err) => {
        console.error("Error fetching mock question", err);
        this.isLoading = false;
      }
    });
}
private moveCurrentToHistory() {
  if (this.currentQuestion && this.currentAnswerText) {
    this.answers.push({
      question: this.currentQuestion,
      answer: this.currentAnswerText
    });
  }
}

// Reset current question & answer for new Q
private resetCurrentQA() {
  this.userAnswer = '';
  this.currentQuestion = '';
  this.currentQuestionText = '';
  this.currentAnswerText = '';
  this.interimAnswerText = '';
  this.confidence = 0;
}
getNextQuestion() {
  this.isLoading = true;
  this.moveCurrentToHistory();
  this.resetCurrentQA();

  const payload = { userEmail: this.userId };

  this.http.post<any>(`${environment.apiBaseUrl}/api/AIInterview/next-question`, payload)
    .subscribe({
      next: async (res) => {
        await this.handleQuestionResponse(res);
      },
      error: (err) => {
        console.error("Error fetching next question", err);
        this.isLoading = false;
      }
    });
}
// Handle question from backend (for mock & next)
private async handleQuestionResponse(res: any) {
  const questionText = res.questionText;
  const words = questionText.split(' ');

  this.audioUrl = res.audioUrl;
  // Always use the requested local avatar video asset
  this.avatarVideoUrl = '/assets/logos/LatestVideo.mp4';
  this.timestamp = new Date().toLocaleTimeString();
  this.questionNumber++;
  this.moodIcon = res.mood?.icon || '😊';
  this.moodText = res.mood?.text || 'Friendly and encouraging';
  this.isLoading = false;

  const audio = new Audio(this.audioUrl);

  const waitForTypingAndAudio = new Promise<void>((resolve) => {
    audio.addEventListener('loadedmetadata', () => {
      const delayPerWord = Math.max((audio.duration * 1000) / words.length, 100);

      this.typeWordsWithDelay(words, delayPerWord);
      audio.play();
      // Enable barge-in: if user starts speaking during question, pause TTS and capture answer
      this.setupBargeInDetection(audio);

      if (this.avatarVideoRef?.nativeElement) {
        const video = this.avatarVideoRef.nativeElement;
        // Play talking segment while question TTS is playing
        video.muted = true;
        video.loop = false;
        const talkStart = this.TALK_START;
        const talkEnd = Math.min(this.TALK_END, (video.duration || this.TALK_END));
        video.currentTime = talkStart;
        video.play();
        const talkLoop = setInterval(() => {
          if (!this.isQuestionTyping) {
            clearInterval(talkLoop);
          }
          if (video.currentTime >= talkEnd) {
            video.currentTime = talkStart;
          }
        }, 200);
      }

          audio.onended = () => {
            // Stop barge-in detection now that question audio is finished
            this.teardownBargeInDetection();

            // Switch avatar to listening loop immediately (don't wait for typing)
            if (this.avatarVideoRef?.nativeElement) {
              const video = this.avatarVideoRef.nativeElement;
              const listenStart = this.LISTEN_START;
              const listenEnd = Math.min(this.LISTEN_END, (video.duration || this.LISTEN_END));
              video.currentTime = listenStart;
              video.play();
              if (this.listenLoopInterval) clearInterval(this.listenLoopInterval);
              this.listenLoopInterval = setInterval(() => {
                if (video.currentTime >= listenEnd) {
                  video.currentTime = listenStart;
                }
              }, 200);
            }
            resolve();
      };
    });
  });

  await waitForTypingAndAudio;
  await this.captureAnswer(); // Start listening right after question ends
}

// Capture answer immediately after question
async captureAnswer(existingStream?: MediaStream) {
  console.log("Starting answer capture...");
  
  try {
    // Request microphone access
    console.log("Requesting microphone access...");
    const stream = existingStream || await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    });
    
    console.log("Microphone access granted");
    
    // Setup noise monitoring
    await this.setupNoiseMonitoring(stream);
    
    // Create media recorder
    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(stream);
    
    // Handle data available event
    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        console.log(`Captured audio chunk of size: ${event.data.size}`);
        // Only buffer chunks locally — do not send partial chunks to the speech-to-text endpoint
        // The backend expects a full audio file; sending tiny 1s fragments causes the backend (OpenAI) to error.
        this.audioChunks.push(event.data);
      }
    };
    
    // Handle recording stop
    this.mediaRecorder.onstop = async () => {
      console.log("Recording stopped");
      stream.getTracks().forEach(track => track.stop());
      this.isRecording = false;

      // Send the final combined audio blob to server for transcription
      if (this.audioChunks.length > 0) {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        // Kick off STT in the background for persistence/correction
        const sttPromise = this.sendAudioToServer(audioBlob).catch(err => {
          console.error('Final sendAudioToServer failed:', err);
        });
        // Immediately proceed to follow-up for fastest response
        try {
          await this.handlePostAnswerConversation();
        } finally {
          // Ensure STT completes eventually (no need to block UI)
          try { await sttPromise; } catch {}
        }
        // Clear buffered chunks after sending
        this.audioChunks = [];
      }
      // Stop listening loop
      if (this.listenLoopInterval) {
        clearInterval(this.listenLoopInterval);
        this.listenLoopInterval = null;
      }
    };
    
    // Start recording
    this.mediaRecorder.start(1000); // Capture in 1-second chunks
    this.isRecording = true;
    console.log("Recording started");

    // Start Web Speech API for live interim transcription (if supported)
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.lang = 'en-US';
        this.speechRecognition.interimResults = true;
        this.speechRecognition.maxAlternatives = 1;

        this.speechRecognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              final += res[0].transcript;
            } else {
              interim += res[0].transcript;
            }
          }
          // Update UI with interim & final
          this.zone.run(() => {
            if (interim) {
              this.interimAnswerText = interim;
            }
            if (final) {
              // Append final to currentAnswerText
              this.currentAnswerText = this.currentAnswerText ? `${this.currentAnswerText} ${final}` : final;
              this.interimAnswerText = '';
              this.lastSpeechTime = Date.now();
              this.resetSilenceTimer();
              this.cdr.detectChanges();
            } else if (interim) {
              this.lastSpeechTime = Date.now();
            }
          });
        };

        this.speechRecognition.onerror = (err: any) => {
          console.warn('SpeechRecognition error:', err);
        };

        this.speechRecognition.onend = () => {
          // don't auto-restart; we will stop when recording stops
        };

        this.speechRecognition.start();
      }
    } catch (err) {
      console.warn('Web Speech API unavailable or failed to start', err);
    }
    
    // Keep avatar in listening segment while recording
    if (this.avatarVideoRef?.nativeElement) {
      const video = this.avatarVideoRef.nativeElement;
      const listenStart = this.LISTEN_START;
      const listenEnd = Math.min(this.LISTEN_END, (video.duration || this.LISTEN_END));
      video.currentTime = listenStart;
      try { video.play(); } catch {}
      if (this.listenLoopInterval) clearInterval(this.listenLoopInterval);
      this.listenLoopInterval = setInterval(() => {
        if (video.currentTime >= listenEnd) {
          video.currentTime = listenStart;
        }
      }, 200);
    }

    // Auto stop sooner to avoid long recordings
    setTimeout(() => {
      if (this.isRecording) {
        console.log("Auto-stopping recording after 12 seconds");
        this.mediaRecorder.stop();
      }
    }, 12000);

  } catch (error: any) {
    console.error("Error setting up audio capture:", error);
    this.isRecording = false;
    
    // Check if it's a permission error
    const isPermissionError = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError' || error.name === 'NotFoundError';
    
    if (isPermissionError) {
      if (this.isSafari) {
        Swal.fire({
          icon: 'info',
          title: 'Safari Microphone Permission Required 🎤',
          html: `
            <p style="font-size: 15px; line-height: 1.5; text-align: center;">
              Safari requires explicit permission for microphone access.<br><br>
              <strong>To enable microphone access:</strong><br>
              1. Click "Safari" in the menu bar → Settings<br>
              2. Go to "Websites" → "Microphone"<br>
              3. Find this website and select "Allow"<br>
              4. Refresh the page and try again<br><br>
              <strong>Alternative:</strong> Look for the microphone icon in the address bar and click "Allow"
            </p>
          `,
          confirmButtonText: 'Try Again',
          confirmButtonColor: '#3085d6',
          allowOutsideClick: false
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Microphone Permission Required 🎤',
          html: `
            <p style="font-size: 15px; line-height: 1.5; text-align: center;">
              Please allow microphone access to continue.<br><br>
              <strong>How to enable:</strong><br>
              1. Click the 🔒 icon in your browser's address bar<br>
              2. Find "Microphone" permissions<br>
              3. Select "Allow"<br>
              4. Click "Continue" to try again
            </p>
          `,
          confirmButtonText: 'Continue',
          confirmButtonColor: '#3085d6',
          allowOutsideClick: false
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Audio Capture Error',
        html: `
          <p style="font-size: 15px; line-height: 1.5; text-align: center;">
            Unable to access your microphone.<br>
            Please ensure your device has a working microphone<br>
            and try again.
          </p>
        `,
        confirmButtonText: 'Got it',
        confirmButtonColor: '#3085d6',
        allowOutsideClick: false
      });
    }
  }
}

// New conversation flow methods
private setupBargeInDetection(audio: HTMLAudioElement) {
  try {
    // Avoid re-initializing if already active
    if (this.bargeInActive) return;
    this.bargeInActive = true;
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then(stream => {
        this.bargeInStream = stream;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        this.bargeInAnalyser = analyser;

        const buf = new Uint8Array(analyser.fftSize);
        let consecutiveHits = 0;
        const HIT_THRESHOLD = 10; // more sensitive amplitude threshold
        const HIT_REQUIRED = 2; // faster trigger (~300ms if interval = 150ms)

        this.bargeInInterval = setInterval(() => {
          if (!this.bargeInAnalyser) return;
          analyser.getByteTimeDomainData(buf);
          // Compute average deviation from 128 (silence center)
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            sum += Math.abs(buf[i] - 128);
          }
          const avg = sum / buf.length;
          if (avg > HIT_THRESHOLD) {
            consecutiveHits++;
          } else {
            consecutiveHits = Math.max(0, consecutiveHits - 1);
          }
          if (consecutiveHits >= HIT_REQUIRED) {
            // User is speaking: barge-in
            this.handleBargeIn(audio);
          }
        }, 150);
      })
      .catch(err => {
        console.warn('Barge-in mic access failed:', err);
        this.bargeInActive = false;
      });
  } catch (e) {
    console.warn('setupBargeInDetection error', e);
    this.bargeInActive = false;
  }
}

private teardownBargeInDetection(stopTracks: boolean = true) {
  try {
    if (this.bargeInInterval) {
      clearInterval(this.bargeInInterval);
      this.bargeInInterval = null;
    }
    if (stopTracks && this.bargeInStream) {
      this.bargeInStream.getTracks().forEach(t => t.stop());
      this.bargeInStream = null;
    }
    this.bargeInAnalyser = null;
    this.bargeInActive = false;
  } catch {}
}

private async handleBargeIn(audio: HTMLAudioElement) {
  // Prevent repeated triggers
  if (!this.bargeInActive) return;
  this.bargeInActive = false;
  // Pause question typing and audio
  try { this.isQuestionTyping = false; } catch {}
  try { audio.pause(); } catch {}
  // Resolve the question flow promise by simulating audio end
  try { audio.dispatchEvent(new Event('ended')); } catch {}
  // Stop any talking loop immediately
  try {
    if (this.avatarVideoRef?.nativeElement) {
      const video = this.avatarVideoRef.nativeElement;
      video.pause();
    }
  } catch {}
  // Switch to listening loop visually
  if (this.avatarVideoRef?.nativeElement) {
    const video = this.avatarVideoRef.nativeElement;
    const listenStart = this.LISTEN_START;
    const listenEnd = Math.min(this.LISTEN_END, (video.duration || this.LISTEN_END));
    video.currentTime = listenStart;
    try { video.play(); } catch {}
    if (this.listenLoopInterval) clearInterval(this.listenLoopInterval);
    this.listenLoopInterval = setInterval(() => {
      if (video.currentTime >= listenEnd) {
        video.currentTime = listenStart;
      }
    }, 200);
  }
  // Stop detection timer/analyser but keep the mic stream for capture
  this.teardownBargeInDetection(false);
  // Start capture using the existing barge-in stream
  try {
    const stream = this.bargeInStream || undefined;
    await this.captureAnswer(stream);
    // After starting capture, release the reference (tracks will stop in capture onstop)
    this.bargeInStream = null;
  } catch (e) {
    console.warn('Failed to start capture after barge-in', e);
    // fallback
    await this.captureAnswer();
  }
}
private speakInterviewer(text: string, useSilentFace: boolean = false): Promise<void> {
  const playAvatarLoop = () => {
    if (this.avatarVideoRef?.nativeElement) {
      const video = this.avatarVideoRef.nativeElement;
      // Ensure any previous listening loop is stopped before switching to talking
      if (this.listenLoopInterval) {
        clearInterval(this.listenLoopInterval);
        this.listenLoopInterval = null;
      }
      // Help autoplay on all browsers
      video.muted = true;
      video.loop = false;
      try { video.pause(); } catch {}
      const start = useSilentFace ? this.LISTEN_START : this.TALK_START;
      const configuredEnd = useSilentFace ? this.LISTEN_END : this.TALK_END;
      const end = Math.min(configuredEnd, (video.duration || configuredEnd));
      video.currentTime = start;
      try { video.play(); } catch {}
      const loop = setInterval(() => {
        if (!this.isInterviewerSpeaking) {
          clearInterval(loop);
          return;
        }
        if (video.currentTime >= end) {
          video.currentTime = start;
        }
      }, 200);
    }
  };

  const endSpeaking = (resolve: () => void) => {
    this.isInterviewerSpeaking = false;
    if (this.avatarVideoRef?.nativeElement) {
      const video = this.avatarVideoRef.nativeElement;
      video.pause();
      video.currentTime = this.LISTEN_START;
    }
    resolve();
  };

  return new Promise<void>(async (resolve) => {
    // 1) Try backend TTS first for consistent female voice
    try {
      const res: any = await this.http.post(`${environment.apiBaseUrl}/api/AIInterview/tts`, { text }).toPromise();
      const url = res?.audioUrl;
      if (url) {
        const audio = new Audio(url);
        this.isInterviewerSpeaking = true;
        playAvatarLoop();
        audio.onended = () => endSpeaking(resolve);
        try {
          await audio.play();
          return; // will resolve on ended
        } catch {
          // fall through to Web Speech
        }
      }
    } catch {
      // ignore and fallback
    }

    // 2) Fallback to Web Speech API
    try {
      const synth = (window as any).speechSynthesis;
      if (synth) {
        const utter = new (window as any).SpeechSynthesisUtterance(text);
        utter.lang = 'en-US';
        utter.rate = 1.0;
        utter.pitch = 1.1; // slightly more feminine tone
        // Try to select a female English voice if available
        const voices = synth.getVoices ? synth.getVoices() : [];
        const preferredNames = ['Microsoft Zira', 'Samantha', 'Google US English', 'Karen', 'Serena'];
        const match = voices.find((v: any) => preferredNames.some(n => (v.name || '').includes(n)) && (v.lang || '').startsWith('en'))
                      || voices.find((v: any) => (v.lang || '').startsWith('en'));
        if (match) utter.voice = match;

        this.isInterviewerSpeaking = true;
        playAvatarLoop();
        utter.onend = () => endSpeaking(resolve);
        synth.cancel();
        synth.speak(utter);
        return; // will resolve on end
      }
    } catch {
      // ignore
    }

    // 3) Last resort: wait approximate duration so flow feels natural
    const approxSeconds = Math.min(8, Math.max(3, Math.round(text.length / 18)));
    this.isInterviewerSpeaking = true;
    playAvatarLoop();
    setTimeout(() => endSpeaking(resolve), approxSeconds * 1000);
  });
}

// Build a follow-up prompt and ask backend, then speak it and advance
private async handlePostAnswerConversation() {
  try {
    // Minimal guard
    const answerText = (this.currentAnswerText || '').trim();
    let followUpText = '';

    if (answerText.length > 0) {
      const payload = {
        question: `Provide a brief, conversational acknowledgement and one follow-up sentence based on the candidate's answer:\n\n${answerText}\n\nKeep it warm, succinct, and natural. Avoid lists.`,
        email: this.userId
      };
      const res: any = await this.http.post(`${environment.apiBaseUrl}/api/AIInterview/ask`, payload).toPromise();
      followUpText = (res?.answer || '').trim();
    }

    if (!followUpText) {
      followUpText = 'Thanks for your answer. Let’s continue.';
    }

    // Always use talking loop for follow-ups (voice is speaking)
    await this.speakInterviewer(followUpText, false);

    // Advance to next question after speaking
    await this.getNextQuestion();
  } catch (err) {
    console.warn('Follow-up conversation failed, advancing:', err);
    await this.getNextQuestion();
  }
}

private shouldUseSilentFace(text: string): boolean {
  const t = (text || '').toLowerCase();
  // If the follow-up contains a question (punctuation or interrogative keywords), use talking loop
  if (t.includes('?')) return false;
  const interrogatives = [
    'how','what','why','where','when','who','which','can','could','would','do','did','does','is','are','will','shall','may','might','should'
  ];
  if (interrogatives.some(w => new RegExp(`\\b${w}\\b`).test(t))) return false;

  // Prefer silent face only for short acknowledgements or greetings with no question intent
  const smallTalkPatterns = [
    'thank you for asking','thanks for asking','nice to meet you','good to meet you','welcome',
    'great to hear','let’s continue','lets continue','thanks for your answer','okay','alright','got it','i appreciate'
  ];
  if (text.length <= 60 && smallTalkPatterns.some(p => t.includes(p))) return true;
  // Default to talking loop for most follow-ups
  return false;
}

async stopRecording() {
  if (!this.isRecording) return;

  this.isRecording = false;
  
  // Clear timers
  this.clearSilenceTimer();
  this.stopNoiseMonitoring();

  // Stop transcription
  try {
    // stop any transcription hub if used
    if (this.transcriptionHub && (this.transcriptionHub as any).stopTranscription) {
      await this.transcriptionHub.stopTranscription();
    }
  } catch (err) {
    console.warn('Error stopping transcription hub:', err);
  }

  // Stop Web Speech recognition if running
  try {
    if (this.speechRecognition) {
      try { this.speechRecognition.stop(); } catch(e) {}
      this.speechRecognition = null;
    }
  } catch (e) {
    console.warn('Error stopping speechRecognition', e);
  }

  // Clean up audio resources
  if (this.mediaStream) {
    this.mediaStream.getTracks().forEach(track => track.stop());
    this.mediaStream = null;
  }

  if (this.processorNode) {
    this.processorNode.disconnect();
    this.processorNode = null;
  }

  // Add any final transcription to the answers
  if (this.currentAnswerText) {
    this.answers.push({
      question: this.currentQuestion,
      answer: this.currentAnswerText
    });
  }
}

// async startRecordingMicOnly() {
//   try {
   
//     const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     this.audioChunks = [];
//     this.mediaRecorder = new MediaRecorder(micStream);

//     this.mediaRecorder.ondataavailable = (event: any) => {
//       if (event.data.size > 0) {
//         this.audioChunks.push(event.data);
//       }
//     };
//     this.mediaRecorder.onstop = () => {
//       const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
//       // this.playAnswerImmediately(audioBlob);
//       this.sendAudioToServer(audioBlob);
//     };

//     this.mediaRecorder.start();
//     this.isRecording = true;

//   } catch (error) {
//     console.error("Error capturing mic audio:", error);
//   }
// }

async sendAudioToServer(blob: Blob) {
  console.log("Sending audio chunk to server...");
  this.isTranscribing = true;

  try {
    const formData = new FormData();
    formData.append('audioFile', blob, 'chunk.webm');
    formData.append('timestamp', new Date().toISOString());
    formData.append('questionNumber', this.questionNumber.toString());
    formData.append('userId', this.userId);

    const response = await this.http.post<any>(`${environment.apiBaseUrl}/api/AIInterview/speech-to-text`, formData).toPromise();

    if (response && response.text) {
      this.zone.run(() => {
        const transcribedText = response.text.trim();
        console.log("Received transcription:", transcribedText);
        if (transcribedText) {
          this.currentAnswerText = this.currentAnswerText ? `${this.currentAnswerText} ${transcribedText}` : transcribedText;
          this.cdr.detectChanges();
        }
      });
    }
  } catch (err) {
    console.error('Error processing audio chunk:', err);
    if (!this.currentAnswerText) {
      this.currentAnswerText = '...';
    }
  } finally {
    this.isTranscribing = false;
  }
}

typeAnswerWordsToCurrent(words: string[], durationInSec?: number, index: number = 0) {
  if (index >= words.length) {
    this.isAnswerTyping = false;

    // Push to answers history only after typing completes
    // this.answers.push({
    //   question: this.lastQuestionAsked,
    //   answer: this.currentAnswerText
    // });

    // Calculate confidence only after typing completes
    if (durationInSec !== undefined) {
      this.confidence = this.calculateConfidence(this.currentAnswerText, durationInSec);
      console.log(" Confidence Score:", this.confidence);
    }
    return;
  }

  this.currentAnswerText += (this.currentAnswerText ? ' ' : '') + words[index];

  setTimeout(() => {
    this.typeAnswerWordsToCurrent(words, durationInSec, index + 1);
  }, 200);
}

playAnswerImmediately(audioBlob: Blob) {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
  // Show processing text until server responds
  this.currentAnswerText = "Processing your answer...";
}

  isTranscribing: boolean = false;

  showSessionExpiredAlert(): void {
      document.body.classList.add('blurred');
      const duration = this.sessionTime;
      Swal.fire({
        title: 'Session Expired',
        text: `Your session has expired after the ${duration}-minute interview limit. Please start a new session to continue.`,
        icon: 'warning',
        showConfirmButton: true,
        confirmButtonText: 'Start New Session',
        customClass: {
          popup: 'custom-swal-popup'
        },
        allowOutsideClick: false,
        allowEscapeKey: false,
        backdrop: true
      }).then(() => {
       
        document.body.classList.remove('blurred');
        this.router.navigate(['/multi-step-mock-interview']); 
      });
  }
  loadCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any>(this.userApiUrl, { headers }).subscribe({
      next: (res) => {
        this.currentUserEmail = res.model?.email || null;
        this.userId = res.model?.userId;
      },
      error: () => localStorage.removeItem('token')
    });
  }
  typeWordsOneByOne(words: string[], index: number = 0) {
    if (index === 0) {
      this.isQuestionTyping = true; 
      this.currentQuestion = ''; 
    }
    if (index >= words.length) {
      this.isQuestionTyping = false;
      return;
    }
    this.currentQuestion += (this.currentQuestion ? ' ' : '') + words[index];
  
    setTimeout(() => {
      this.typeWordsOneByOne(words, index + 1);
    }, 150); // Adjust speed as needed
  }
 

  isAudioPlaying: boolean = false;
  moodText: string = '';
  moodIcon: string = '';

  

  stopVideoWhenTypingAndAudioEnd() {
  const checkInterval = setInterval(() => {
    if (!this.isQuestionTyping && this.avatarVideoRef?.nativeElement) {
      this.avatarVideoRef.nativeElement.pause();
      this.avatarVideoRef.nativeElement.currentTime = 0;
      clearInterval(checkInterval); // Stop checking
    }
  }, 300); // Check every 300ms
  }

  playAudio(url: string) {
    const audio = new Audio(url);
    audio.play();

    // Mark audio as playing
    let isAudioPlaying = true;

    // Start video playback if available
    const video = this.avatarVideoRef?.nativeElement;
    if (video) {
      video.muted = true;
      video.play();
    }

    // When audio ends
    audio.onended = () => {
      isAudioPlaying = false;

    
      setTimeout(() => {
        if (!this.isQuestionTyping && this.avatarVideoRef?.nativeElement) {
          this.avatarVideoRef.nativeElement.pause();
          this.avatarVideoRef.nativeElement.currentTime = 0;
        }
      }, 500); // wait a bit in case typing is still finishing
    };
  }
  moods: Mood[] = [
    { icon: "😊", text: "Friendly and encouraging" },
    { icon: "🤔", text: "Thoughtfully listening" },
    { icon: "👍", text: "Impressed with response" },
    { icon: "😌", text: "Relaxed and supportive" },
    { icon: "🎯", text: "Focused on details" }
  ];
  
  currentMood: Mood = this.moods[0];
 
  totalQuestions: number = 10; 

  get progressPercentage(): number {
    // Example: If 5 questions answered, show % relative to 10 questions
    const total = this.totalQuestions;
    return total === 0 ? 0 : Math.min(100, (this.answers.length / total) * 100);
  }
  get currentQuestionNumber(): number {
    return this.questionNumber;
  }
  formattedDuration: string = '';



 confidence: number = 0; // Default value
 

 



 calculateConfidence(answer: string, responseTimeInSec: number): number {
  const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'well'];
  const words = answer.split(/\s+/).filter(w => w.trim() !== '');
  const wordCount = words.length;

  const fillerCount = words.filter(w => fillerWords.includes(w.toLowerCase())).length;

  // Ideal range: 50–150 words in 20–60 seconds
  let lengthScore = Math.min((wordCount / 150) * 100, 100);
  let speedScore = Math.max(0, Math.min((wordCount / responseTimeInSec) * 5, 100));
  let fillerPenalty = Math.min(fillerCount * 5, 30); 

  let rawConfidence = (lengthScore * 0.4) + (speedScore * 0.4) - fillerPenalty;

  // Normalize from raw range (e.g., 0–100) to new range (50–100)
  rawConfidence = Math.max(0, Math.min(rawConfidence, 100)); // Clamp between 0-100 first
  let finalConfidence = 50 + (rawConfidence / 100) * 50;

  return Math.round(finalConfidence);
}


  typeWordsWithDelay(words: string[], delay: number, index: number = 0) {
    if (index === 0) {
      this.isQuestionTyping = true;
      this.currentQuestion = '';
    }

    if (index >= words.length) {
      this.isQuestionTyping = false;
      return;
    }

    this.currentQuestion += (this.currentQuestion ? ' ' : '') + words[index];

    setTimeout(() => {
      this.typeWordsWithDelay(words, delay, index + 1);
    }, delay);
  }
  typeAnswerWordsOneByOne(words: string[], index: number = 0) {
    if (index >= words.length) {
      this.isAnswerTyping = false;
      return;
    }
  
    this.userAnswer += (this.userAnswer ? ' ' : '') + words[index];
  
    setTimeout(() => {
      this.typeAnswerWordsOneByOne(words, index + 1);
    }, 200); // You can adjust typing speed here
  }

  stopInterview(): void {
    this.idleService.resumeTimeout();
    
    // Exit fullscreen on mobile
    if (this.isMobile) {
      this.exitFullscreen();
    }
    
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to stop the mock interview?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, stop it',
      cancelButtonText: 'No, continue',
      reverseButtons: true
    }).then(result => {
      if (result.isConfirmed) {
        // Show spinner while waiting for backend
        Swal.fire({
          title: 'Please wait',
          html: 'Generating mock interview summary...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        if (this.durationTimer) {
          clearInterval(this.durationTimer);
        }

        // Ensure we finalize any ongoing recording and capture the last Q&A
        try {
          this.stopRecording();
        } catch {}
        if (this.currentQuestion && this.currentAnswerText) {
          const alreadySaved = this.answers.some(a => a.question === this.currentQuestion && a.answer === this.currentAnswerText);
          if (!alreadySaved) {
            this.answers.push({ question: this.currentQuestion, answer: this.currentAnswerText });
          }
        }
        // Guard: must have a user id/email to save
        if (!this.userId) {
          Swal.close();
          Swal.fire('Login required', 'Please sign in to save your report.', 'info');
          this.router.navigate(['/multi-step-mock-interview']);
          return;
        }
        // Guard: avoid 400 Bad Request when no questions captured
        if (!this.answers || this.answers.length === 0) {
          Swal.close();
          Swal.fire({
            title: 'No Answers Captured',
            icon: 'info',
            html: `
              <div style="text-align:left; font-size:1rem;">
                <p>We couldn't capture any responses from this session, so a report can't be generated yet.</p>
                <p>To generate a report, please answer at least one question.</p>
                <p>If you spoke but your answer wasn't captured, try these quick checks:</p>
                <ul style="margin-left: 1rem;">
                  <li>Ensure the browser has microphone permission.</li>
                  <li>Speak for at least 3–5 seconds before stopping.</li>
                  <li>Wait for the transcription to appear under the question.</li>
                </ul>
              </div>
            `,
            confirmButtonText: 'Start New Session'
          }).then(() => {
            this.interviewStarted = false;
            this.currentQuestion = '';
            this.userAnswer = '';
            this.questionNumber = 1;
            this.answers = [];
            this.avatarVideoUrl = '';
            this.audioChunks = [];
            this.router.navigate(['/multi-step-mock-interview']);
          });
          return;
        }


        const endTime = new Date();
        const totalSeconds = Math.round((endTime.getTime() - this.startTime!.getTime()) / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const durationFormatted = hours > 0
          ? `${hours}h ${minutes}m ${seconds}s`
          : `${minutes}m ${seconds}s`;
          const duration = hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
          this.formattedDuration = durationFormatted;



        const payload = {
          email: this.userId,
          totalQuestions: this.answers.length,
          questions: this.answers.map(a => ({
            question: a.question,
            answer: a.answer
          })),
          durationInSeconds: durationFormatted,
          interviewType: 'Mock'
        };

        // Save report first (now lightweight)
        this.http.post<any>(`${environment.apiBaseUrl}/api/InterviewReports/SaveReport`, payload).subscribe({
          next: (saveRes) => {
            const reportId = saveRes?.reportId;
            console.log(' Report saved. Now generating combined summary...');

            // Generate combined summary in a single, faster request
            this.http.post<any>(`${environment.apiBaseUrl}/api/InterviewReports/GenerateSummary`, payload)
              .toPromise()
              .then(async (summaryRes) => {
                Swal.close();
                this.showMockSummaryModal({ analysis: summaryRes.analysis }, { improvements: summaryRes.improvements, weaknesses: summaryRes.weaknesses });

                // Persist feedback to the saved report
                if (reportId) {
                  const improvementsText = (summaryRes.improvements || []).join("\n");
                  const weaknessesText = (summaryRes.weaknesses || []).join("\n");
                  try {
                    await this.http.post(`${environment.apiBaseUrl}/api/InterviewReports/UpdateReportFeedback`, {
                      reportId,
                      improvements: improvementsText,
                      weaknesses: weaknessesText
                    }).toPromise();
                  } catch (e) {
                    console.warn('Failed to persist feedback to report:', e);
                  }
                }
              })
              .catch(async err => {
                // Fallback for older backend without GenerateSummary
                if (err?.status === 404) {
                  try {
                    const [analysisRes, feedbackRes] = await Promise.all([
                      this.http.post<any>(`${environment.apiBaseUrl}/api/InterviewReports/GenerateAnalysis`, payload).toPromise(),
                      this.http.post<any>(`${environment.apiBaseUrl}/api/InterviewReports/GenerateFeedback`, payload).toPromise()
                    ]);
                    Swal.close();
                    this.showMockSummaryModal(analysisRes, feedbackRes);

                    if (reportId) {
                      const improvementsText = (feedbackRes?.improvements || []).join("\n");
                      const weaknessesText = (feedbackRes?.weaknesses || []).join("\n");
                      try {
                        await this.http.post(`${environment.apiBaseUrl}/api/InterviewReports/UpdateReportFeedback`, {
                          reportId,
                          improvements: improvementsText,
                          weaknesses: weaknessesText
                        }).toPromise();
                      } catch (e) {
                        console.warn('Failed to persist feedback to report (fallback):', e);
                      }
                    }
                  } catch (e2) {
                    console.error('Fallback summary generation failed', e2);
                    Swal.fire('Error', 'Failed to get interview summary.', 'error');
                  }
                  return;
                }
                console.error("Failed to generate summary", err);
                Swal.fire('Error', 'Something went wrong while getting interview summary.', 'error');
              });
          },
          error: err => {
            console.error(' Failed to save interview report:', err);
            Swal.fire('Error', 'Failed to save report before summary.', 'error');
          }
        });
      }
    });
  }

  durationTimer: any;
  elapsedSeconds: number = 0;
  startDurationTimer() {
    this.durationTimer = setInterval(() => {
      this.elapsedSeconds++;

      const minutes = Math.floor(this.elapsedSeconds / 60);
      const seconds = this.elapsedSeconds % 60;

      // Pad seconds for 2-digit format (like 5:03s)
      const formatted = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}s`;
      this.formattedDuration = formatted;
    }, 1000);
  }

  cleanPoint(text: string): string {
    const withoutNumber = text.replace(/^\d+\.\s*/, '');
    return withoutNumber.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  } 

  private showMockSummaryModal(analysisRes: any, feedbackRes: any) {
    try {
      const analysisContainer = document.getElementById('mockAnalysisContent');
      const improvementsContainer = document.getElementById('mockImprovementsContent');
      const weaknessesContainer = document.getElementById('mockWeaknessesContent');

      const analysisHtml = `<ul style="padding-left:20px;">${(analysisRes?.analysis || [])
        .map((point: string) => `<li>${this.cleanPoint(point)}</li>`)
        .join('')}</ul>`;
      const improvementsHtml = `<ul style="padding-left:20px;">${(feedbackRes?.improvements || [])
        .map((imp: string) => `<li>${imp}</li>`)
        .join('')}</ul>`;
      const weaknessesHtml = `<ul style="padding-left:20px;">${(feedbackRes?.weaknesses || [])
        .map((wk: string) => `<li>${wk}</li>`)
        .join('')}</ul>`;

      if (analysisContainer) analysisContainer.innerHTML = analysisHtml;
      if (improvementsContainer) improvementsContainer.innerHTML = improvementsHtml;
      if (weaknessesContainer) weaknessesContainer.innerHTML = weaknessesHtml;

      const modalEl = document.getElementById('mockSummaryModal');
      if (modalEl) {
        const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: true });
        modal.show();

        // After closing the modal, reset state and navigate as before
        modalEl.addEventListener('hidden.bs.modal', () => {
          this.interviewStarted = false;
          this.currentQuestion = '';
          this.userAnswer = '';
          this.questionNumber = 1;

          if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
          }

          this.answers = [];
          this.avatarVideoUrl = '';
          this.audioChunks = [];

          this.router.navigate(['/multi-step-mock-interview']);
        }, { once: true });
      }
    } catch (e) {
      console.warn('Failed to display mock summary modal, falling back to alert.', e);
      Swal.fire('Mock Summary', 'Summary is ready but could not render the modal.', 'info');
    }
  }
  
  // Fullscreen helpers for mobile
  private requestFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.log('Fullscreen request failed:', err);
      });
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).mozRequestFullScreen) {
      (elem as any).mozRequestFullScreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
  }
  
  private exitFullscreen() {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.log('Fullscreen exit failed:', err);
        });
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }
  
  // Noise monitoring
  private async setupNoiseMonitoring(stream: MediaStream) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      this.audioAnalyser = audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      source.connect(this.audioAnalyser);
      
      // Start monitoring noise levels
      this.noiseCheckInterval = setInterval(() => this.checkNoiseLevel(), 1000);
    } catch (err) {
      console.warn('Failed to setup noise monitoring:', err);
    }
  }
  
  private checkNoiseLevel() {
    if (!this.audioAnalyser || !this.isRecording) return;
    
    const dataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
    this.audioAnalyser.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const noiseLevel = (average / 256) * 100;
    
    // If noise is too high, warn user
    if (noiseLevel > this.noiseThreshold && !this.isPlayingTransition) {
      this.showNoiseWarning();
    }
  }
  
  private showNoiseWarning() {
    // Pause interview temporarily
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.pause();
      
      Swal.fire({
        icon: 'warning',
        title: 'Background Noise Detected 🔊',
        html: `
          <p style="font-size: 15px; line-height: 1.6; text-align: center;">
            I'm picking up quite a bit of background noise.<br>
            Could you find a quieter spot to continue?<br><br>
            <strong>This will help me hear your answers better!</strong>
          </p>
        `,
        confirmButtonText: 'Resume Interview',
        confirmButtonColor: '#3085d6',
        allowOutsideClick: false
      }).then(() => {
        if (this.mediaRecorder) {
          this.mediaRecorder.resume();
        }
      });
    }
  }
  
  private stopNoiseMonitoring() {
    if (this.noiseCheckInterval) {
      clearInterval(this.noiseCheckInterval);
      this.noiseCheckInterval = null;
    }
  }
  
  // Silence detection for auto-advance
  private resetSilenceTimer() {
    this.clearSilenceTimer();
    
    this.silenceTimer = setTimeout(() => {
      this.onSilenceDetected();
    }, this.silenceThreshold);
  }
  
  private clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
  
  private async onSilenceDetected() {
    if (!this.isRecording || this.isPlayingTransition) return;
    
    // User has stopped speaking for 3 seconds
    console.log('Silence detected - auto advancing');
    
    // Stop recording
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }
  
  // Natural transition after user answers
  private async playTransition() {
    if (this.isPlayingTransition) return;
    
    this.isPlayingTransition = true;
    
    const phrase = this.transitionPhrases[Math.floor(Math.random() * this.transitionPhrases.length)];
    
    // Show transition in UI
    await new Promise<void>((resolve) => {
      Swal.fire({
        icon: 'success',
        html: `<p style="font-size: 18px; font-weight: 500;">${phrase} 👍</p>`,
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false
      }).then(() => {
        this.isPlayingTransition = false;
        resolve();
      });
    });
    
    // Auto-advance to next question
    await this.getNextQuestion();
  }
}
