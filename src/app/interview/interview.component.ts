import { Component,ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule,HttpHeaders } from '@angular/common/http';
import RecordRTC, { StereoAudioRecorder } from 'recordrtc';
import { CommonModule } from '@angular/common';
import { RouterModule,ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { SafeUrlPipe } from '../safe-url.pipe';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment';
import { IdleTimeOutService } from '../idle-time-out-service';

@Component({
  selector: 'app-interview',
  standalone: true, 
  imports: [HttpClientModule, RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './interview.component.html',
  styleUrls: ['./interview.component.css']
})
export class InterviewComponent implements OnInit {
  interviewForm: FormGroup;
  videoSrc: string = '';
  isRecording: boolean = false;
  
  recorder: any;
  micStream: MediaStream | null = null;
  videoStream: MediaStream | null = null;
  interval: any;
  transcripts: { question: number, text: string, time: string }[] = [];

  // Speech Recognition properties
  private recognition: any;
  private interimTranscript: string = '';
  private finalTranscript: string = '';
  private currentSpeechSegment: string = '';
  private isSentenceComplete: boolean = false;

  aiResponse: string = '';
 
  chatHistory: { 
    question: string; 
    answer: string; 
    questionNumber: number; 
    timestamp: string; 
  }[] = [];
  
  timer: any;
  startTime: Date = new Date();
  timerDisplay: string = '';
  isSidebarHidden = true;
  currentUserEmail: string | null = null;
  sessionTime: number | null = null;
  audioQueue: Blob[] = [];
  isQuestionTyping = false;
  isAnswerTyping = false;
  userId:string = " ";
  chunkSize: number = 250;
  currentWords: string[] = [];
  questionCount = 1;
  name: string = " ";
  currentQuestion: string = '';
  currentAnswer: string = '';
  isTyping: boolean = false;
  confidence: number = 0;
  responseTime: string = '';
  currentQuestionIndex: number = 0;
  questions: string[] = [];
  isMobile: boolean = false;
  isSafari: boolean = false;

  private userApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster`;
  


  private isUserAtBottom = true;

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('answerContainer') answerContainer!: ElementRef;
  
  constructor(private fb: FormBuilder, private http: HttpClient,private route: ActivatedRoute,private router: Router,private idleService: IdleTimeOutService) {
    this.interviewForm = this.fb.group({
      meetingLink: ['']
    });
    // Detect if user is on mobile device
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    // Detect Safari browser
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  ngOnDestroy() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.warn('Error stopping speech recognition:', error);
      }
    }
    this.stopRecording();

    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      // Longer silence threshold for natural pauses
      this.recognition.interimResults = true;

      this.recognition.onresult = (event: any) => {
        let fullTranscript = '';
        let isFinal = false;

        // Combine all results to form complete sentences
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          isFinal = event.results[i].isFinal;
          
          // Clean up the transcript
          const cleanTranscript = transcript.trim();
          
          if (isFinal) {
            // Check if this appears to be a complete sentence
            const endsWithPunctuation = /[.!?]$/.test(cleanTranscript);
            this.isSentenceComplete = endsWithPunctuation;

            // Append to current segment
            if (this.currentSpeechSegment) {
              this.currentSpeechSegment += ' ' + cleanTranscript;
            } else {
              this.currentSpeechSegment = cleanTranscript;
            }

            // If we have a complete sentence or significant pause
            if (this.isSentenceComplete) {
              // Update the current question with proper capitalization
              if (this.currentQuestion) {
                this.currentQuestion += ' ' + this.currentSpeechSegment;
              } else {
                this.currentQuestion = this.currentSpeechSegment;
              }
              this.currentSpeechSegment = ''; // Reset for next sentence
              
              // Trigger immediate display
              const words = this.currentQuestion.split(' ');
              this.typeWordsOneByOne(words);
            }
          } else {
            // For interim results, show in real-time but don't commit
            fullTranscript = this.currentQuestion + 
              (this.currentQuestion ? ' ' : '') + 
              this.currentSpeechSegment +
              (this.currentSpeechSegment ? ' ' : '') + 
              cleanTranscript;
              
            // Update display with interim results
            const words = fullTranscript.split(' ');
            this.typeWordsOneByOne(words);
          }
        }
      };

      this.recognition.onend = () => {
        // If there's any remaining speech segment, commit it
        if (this.currentSpeechSegment) {
          if (this.currentQuestion) {
            this.currentQuestion += ' ' + this.currentSpeechSegment;
          } else {
            this.currentQuestion = this.currentSpeechSegment;
          }
          this.currentSpeechSegment = '';
          
          // Final display update
          const words = this.currentQuestion.split(' ');
          this.typeWordsOneByOne(words);
        }
        
        // Restart recognition if still recording
        if (this.isRecording) {
          this.recognition.start();
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Restart on recoverable errors
        if (event.error !== 'not-allowed' && this.isRecording) {
          setTimeout(() => {
            this.recognition.start();
          }, 1000);
        }
      };
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }
  
  ngAfterViewInit() {
    this.scrollContainer.nativeElement.addEventListener('scroll', () => this.checkScrollPosition());
  }
  
  private checkScrollPosition(): void {
    const el = this.scrollContainer.nativeElement;
    const threshold = 80; // px from bottom
    const position = el.scrollTop + el.clientHeight;
    const height = el.scrollHeight;
  
    this.isUserAtBottom = position >= height - threshold;
  }
  
  ngAfterViewChecked(): void {
    if (this.isUserAtBottom) {
      this.scrollToBottom();
    }
  }
  
  private scrollToBottom(): void {
    try {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch (err) {
      console.error('Auto scroll failed', err);
    }
  }
  
  ngOnInit(): void {
    this.loadCurrentUser();
   
    this.route.queryParams.subscribe(params => {
      this.sessionTime = +params['time'] || null;
      console.log('Session Duration:', this.sessionTime);
    });
    if (this.sessionTime) {
      setTimeout(() => {
        this.stopRecording();
        this.showSessionExpiredAlert();
      }, this.sessionTime * 60000);
    }
   
  };
 
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
      this.router.navigate(['/multi-step-interview']); 
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
        this.name = res.model?.displayName;
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

  const word = words[index];
  this.currentWords.push(word);
  this.currentQuestion += (this.currentQuestion ? ' ' : '') + word;

  setTimeout(() => {
    this.typeWordsOneByOne(words, index + 1);
  }, 200);
  }


  answerQueue: { text: string, questionNumber: number }[] = [];
  
  async startRecording() {
    this.idleService.pauseTimeout();
    
    // Debug logging
    console.log('=== DEBUG INFO ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('isMobile:', this.isMobile);
    console.log('isSafari:', this.isSafari);
    console.log('==================');
    
    try {
      // Reset all speech and transcript-related state
      this.finalTranscript = '';
      this.interimTranscript = '';
      this.currentQuestion = '';
      this.currentWords = [];
      this.currentSpeechSegment = '';
      this.isSentenceComplete = false;
      
      let audioStream: MediaStream;
      
      if (this.isMobile) {
        // Mobile: Use microphone only (captures user responses + interviewer audio from speakers)
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false, // Disable to capture both sides
            noiseSuppression: false,  // Disable to capture interviewer audio from speakers
            autoGainControl: true
          }
        });
        
        this.micStream = micStream;
        audioStream = micStream;
        
        console.log('Mobile: Using microphone to capture both interviewer and user audio');
      } else {
        // Desktop: Capture both screen/tab audio (interviewer) AND microphone (user)
        const displayStream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: true,
          audio: true
        });
    
        // Save reference to video stream
        this.videoStream = displayStream;
        
        // Also get user's microphone
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        this.micStream = micStream;
    
        // Mix both audio streams (interviewer + user)
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();
        
        // Add screen/tab audio (interviewer)
        const displayAudioTracks = displayStream.getAudioTracks();
        if (displayAudioTracks.length > 0) {
          const displaySource = audioContext.createMediaStreamSource(new MediaStream(displayAudioTracks));
          displaySource.connect(destination);
        }
        
        // Add microphone audio (user)
        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(destination);
        
        audioStream = destination.stream;
        
        console.log('Desktop: Mixing screen/tab audio (interviewer) + microphone (user)');
      }
  
      // Initialize RecordRTC with mixed audio stream
      this.recorder = new RecordRTC(audioStream, {
        type: 'audio',
        mimeType: 'audio/webm',
        recorderType: StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
        timeSlice: 5000,
        ondataavailable: (blob: Blob) => {
          this.sendAudio(blob);
        }
      });
  
      // Start both recording and speech recognition
      this.recorder.startRecording();
      if (this.recognition) {
        this.recognition.start();
        console.log('Speech recognition started');
      }
      this.isRecording = true;
      
      // Request fullscreen on mobile for better view
      if (this.isMobile) {
        this.requestFullscreen();
      }
  
    } catch (err: any) {
      console.error('Error starting recording:', err);
      
      // Check if it's a permission error
      const isPermissionError = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'NotFoundError';
      
      let errorMessage = '';
      let errorTitle = 'Interview Cannot Start 📵';
      
      if (isPermissionError) {
        if (this.isSafari) {
          errorTitle = 'Safari Microphone Permission Required 🎤';
          errorMessage = `
            <p style="font-size: 15px; line-height: 1.5; text-align: center;">
              Safari requires explicit permission for microphone access.<br><br>
              <strong>To enable microphone access:</strong><br>
              1. Click "Safari" in the menu bar → Settings<br>
              2. Go to "Websites" → "Microphone"<br>
              3. Find this website and select "Allow"<br>
              4. Refresh the page and try again<br><br>
              <strong>Alternative:</strong> Look for the microphone icon in the address bar and click "Allow"
            </p>
          `;
        } else if (this.isMobile) {
          errorTitle = 'Microphone Permission Required 🎤';
          errorMessage = `
            <p style="font-size: 15px; line-height: 1.5; text-align: center;">
              Please allow microphone access to start the interview.<br><br>
              <strong>How to enable:</strong><br>
              1. Click the 🔒 icon in your browser's address bar<br>
              2. Find "Microphone" permissions<br>
              3. Select "Allow"<br>
              4. Refresh the page and try again
            </p>
          `;
        } else {
          errorTitle = 'Screen & Audio Permission Required 🎬';
          errorMessage = `
            <p style="font-size: 15px; line-height: 1.5; text-align: center;">
              Please allow screen sharing and microphone access.<br><br>
              When prompted, make sure to:<br>
              ✓ Select the tab/window with the interview<br>
              ✓ Check "Share audio" option<br>
              ✓ Allow microphone access
            </p>
          `;
        }
      } else {
        // Other errors (e.g., no microphone hardware)
        errorMessage = this.isMobile 
          ? `
            <p style="font-size: 15px; line-height: 1.5; text-align: center;">
              Unable to access your microphone.<br>
              Please ensure your device has a working microphone<br>
              and try again.
            </p>
          `
          : `
            <p style="font-size: 15px; line-height: 1.5; text-align: center;">
              Unable to capture audio.<br>
              Please ensure you select a tab/window with "Share audio" checked,<br>
              and allow microphone access for capturing your responses.
            </p>
          `;
      }
      
      Swal.fire({
        icon: isPermissionError ? 'info' : 'warning',
        title: errorTitle,
        html: errorMessage,
        confirmButtonText: isPermissionError ? 'Try Again' : 'Got it',
        confirmButtonColor: '#3085d6',
        allowOutsideClick: false
      });
    }
  }
  
  typeAnswerOneByOne(rawAnswer: string, questionNumber: number, lineIndex: number = 0, startTime?: number) {
  const lines = rawAnswer.split('\n').filter(line => line.trim() !== '');
  const chat = this.chatHistory.find(c => c.questionNumber === questionNumber);

  if (lineIndex === 0 && chat) {
    console.log('[DEBUG] Initializing typing...');
    chat.answer = '';
    this.currentAnswer = '';
    this.isAnswerTyping = true;
    this.isTyping = true;
    startTime = performance.now();
    this.responseTime = '';
  }

  if (lineIndex < lines.length) {
    const currentLine = lines[lineIndex].trim();
    console.log('[DEBUG] Typing line:', currentLine);

    if (chat) {
      chat.answer += currentLine + '<br>';
      this.chatHistory = [...this.chatHistory];
    }

    this.currentAnswer += currentLine + '\n';
    this.scrollAnswerToBottom();

    setTimeout(() => {
      this.typeAnswerOneByOne(rawAnswer, questionNumber, lineIndex + 1, startTime);
    }, 400);

  } else {
    console.log('[DEBUG] Finished typing all lines');

    setTimeout(() => {
      if (chat) {
        chat.answer = chat.answer.trim();
        this.chatHistory = [...this.chatHistory];
      }

      this.isTyping = false;
      this.isAnswerTyping = false;

      if (startTime) {
        const end = performance.now();
        const duration = (end - startTime) / 1000;

        this.responseTime = `${duration.toFixed(2)}s`;

        const confidenceScore = this.calculateConfidence(this.currentAnswer, duration);
        this.confidence = confidenceScore;
        console.log('[DEBUG] Confidence Score:', confidenceScore);
      }
      else {
        console.warn('[WARNING] startTime is missing!');
      }

      // this.confidence = Math.floor(Math.random() * 21) + 80;

      if (this.audioQueue.length > 0) {
        const nextBlob = this.audioQueue.shift();
        if (nextBlob) this.sendAudio(nextBlob);
      } else if (this.answerQueue.length > 0) {
        const next = this.answerQueue.shift();
        if (next) this.askAI(next.text, next.questionNumber);
      }
    }, 100);
  }
  }

  calculateConfidence(answer: string, responseTimeInSec: number): number {
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'well'];
    const words = answer.split(/\s+/).filter(w => w.trim() !== '');
    const wordCount = words.length;

    const fillerCount = words.filter(w => fillerWords.includes(w.toLowerCase())).length;

    // Ideal range: 50–150 words in 20–60 seconds
    let lengthScore = Math.min((wordCount / 150) * 100, 100);
    let speedScore = Math.max(0, Math.min((wordCount / responseTimeInSec) * 5, 100));
    let fillerPenalty = Math.min(fillerCount * 5, 30); // Max 30 points penalty

    let rawConfidence = (lengthScore * 0.4) + (speedScore * 0.4) - fillerPenalty;

    let finalConfidence = Math.max(50, Math.min(Math.round(rawConfidence), 100)); 
    return finalConfidence;
  }


  sanitizeQuestion(raw: string): string {
    return raw.replace(/Question \d+: /, '');
  }
 

    stopRecording() {
    this.idleService.resumeTimeout();
    this.isRecording = false;
    
    // Exit fullscreen on mobile
    if (this.isMobile) {
      this.exitFullscreen();
    }
    clearInterval(this.timer);
    this.timerDisplay = '';
    const endTime = new Date();
  
    if (this.recorder) {
      this.recorder.stopRecording(() => {
        this.recorder = null;
      });
    }

    // Stop speech recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
        console.log('Speech recognition stopped');
      } catch (error) {
        console.warn('Error stopping speech recognition:', error);
      }
    }
  
    [...(this.micStream?.getTracks() || []), ...(this.videoStream?.getTracks() || [])]
      .forEach(track => track.stop());
  
    this.micStream = null;
    this.videoStream = null;

     Swal.fire({
            title: 'Interview Ended',
            text: 'Do you want to export the chat?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Export Chat',
            cancelButtonText: 'No Thanks',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.fire({
                title: 'Exporting...',
                text: 'Please wait while the summary is being exported.',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                  Swal.showLoading();
                  this.exportChat();
  
                  setTimeout(() => {
                    Swal.fire({
                      icon: 'success',
                      title: 'Exported!',
                      text: 'Your summary has been downloaded.',
                      timer: 2000,
                      showConfirmButton: false
                    }).then(() => {
                      this.router.navigate(['/multi-step-interview']);
                    });
                  }, 1000);
                }
              });
            } else {
              this.router.navigate(['/multi-step-interview']);
            }
          });
  
    const totalSeconds = Math.round((new Date().getTime() - this.startTime!.getTime()) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
  
    let durationFormatted = '';
    if (hours > 0) {
      durationFormatted = `${hours}h ${minutes}m ${seconds}s`;
    } else {
      durationFormatted = `${minutes}m ${seconds}s`;
    }
  
    // Prepare transcript text
    const formattedTranscript = this.chatHistory.map(t => `Q ${t.question} (${t.timestamp})`).join('\n\n');
    const transcriptBlob = new Blob([formattedTranscript], { type: 'text/plain' });
  
    // Auto download
    const url = window.URL.createObjectURL(transcriptBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transcript.txt';
    link.click();
    window.URL.revokeObjectURL(url);
  
    // Convert to base64 and then send to backend
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Transcript = (reader.result as string)?.split(',')[1];
      
      const payload = {
        email: this.userId,
        totalQuestions: this.chatHistory.length,
        questions: this.chatHistory.map(q => ({
          question: q.question,
          answer: q.answer
        })),
        durationInSeconds: durationFormatted,
        interviewType: 'Live',
        transcriptFileBase64: base64Transcript,
        transcriptFileName: 'transcript.txt'
       
      };
  
      this.http.post(`${environment.apiBaseUrl}/api/InterviewReports/SaveReport`, payload)
        .subscribe(() => {
          console.log('Interview report saved.');
  
         
        }, err => {
          console.error('Failed to save report:', err);
      });
        
    };
   
      const chatText = this.chatHistory.map(c =>
        `Question ${c.questionNumber}:\n${c.question}\n\nAnswer:\n${c.answer}\n\n`
      ).join('\n-------------------\n');

      const summaryPayload = {
        chatText: chatText,
        email: this.currentUserEmail,
        displayName:this.name
      };

      this.http.post(`${environment.apiBaseUrl}/api/AIInterview/generate-summary`, summaryPayload)
        .subscribe(() => {
          console.log('Summary requested and email sent.');
        }, err => {
          console.error('Failed to generate/send summary:', err);
      });

    reader.readAsDataURL(transcriptBlob); // Start base64 conversion
    }
 
    sendAudio(blob: Blob) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const reader = new FileReader();

      reader.onload = async () => {
        const arrayBuffer = reader.result as ArrayBuffer;

        try {
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const rawData = audioBuffer.getChannelData(0);
          const samples = 1024;
          let total = 0;

          for (let i = 0; i < rawData.length; i += samples) {
            const slice = rawData.slice(i, i + samples);
            const rms = Math.sqrt(slice.reduce((sum, val) => sum + val * val, 0) / samples);
            total += rms;
          }

          const avgVolume = total / (rawData.length / samples);
          if (avgVolume < 0.001) {
            console.warn('Silent audio detected. Skipping...');
            return;
          }

          const formData = new FormData();
          formData.append('audioFile', blob, 'recorded_audio.webm');

          this.http.post<any>(`${environment.apiBaseUrl}/api/AIInterview/speech-to-text`, formData).subscribe(res => {
            const fullText = res.text?.trim();
            if (!fullText) return;

            const words = fullText.split(/\s+/).filter((w: any) => w);
            const MAX_WORDS = 150;
            const chunks: string[] = [];

            let currentChunk: string[] = [];

            for (let i = 0; i < words.length; i++) {
              currentChunk.push(words[i]);

              const endsWithPunctuation = /[.?!]$/.test(words[i]);

              // Create chunk if max words OR sentence ends
              if (currentChunk.length >= MAX_WORDS || (endsWithPunctuation && currentChunk.length > 6)) {
                chunks.push(currentChunk.join(' '));
                currentChunk = [];
              }
            }

            if (currentChunk.length > 0) {
              chunks.push(currentChunk.join(' '));
            }

            const processChunk = (index: number) => {
              if (index >= chunks.length) return;

              const sentenceWords = chunks[index].split(' ').filter(w => w);
              this.currentWords = [];
              this.currentQuestion = ''; // reset current question
              this.typeWordsOneByOne(sentenceWords, 0);

              const waitInterval = setInterval(() => {
                if (!this.isQuestionTyping && !this.isAnswerTyping) {
                  clearInterval(waitInterval);

                  const questionText = sentenceWords.join(' ');
                  this.askAI(questionText, this.questionCount);

                  this.questions.push(questionText); // update for UI
                  this.currentQuestionIndex = this.questionCount;

                  this.questionCount++;
                  processChunk(index + 1);
                }
              }, 300);
            };


            processChunk(0);
          }, err => {
            console.error('Speech to text error:', err);
          });

        } catch (error) {
          console.error('Failed to decode audio:', error);
        }
      };

      reader.readAsArrayBuffer(blob);
    }

    askAI(text: string, questionNumber: number) {
      if (this.isAnswerTyping) {
        this.answerQueue.push({ text, questionNumber });
        return;
      }

      this.isAnswerTyping = true;

      const payload = {
        question: text,
        email: this.userId
      };

      // Push question into chat history BEFORE calling API
      const timestamp = new Date().toLocaleTimeString();
      this.chatHistory.push({
        question: text,
        answer: '', // will be updated in typeAnswerOneByOne
        questionNumber: questionNumber,
        timestamp: timestamp
      });

      this.http.post<any>(`${environment.apiBaseUrl}/api/AIInterview/ask`, payload).subscribe(res => {
        //  const formattedAnswer = this.formatAnswer(res.answer);
        this.typeAnswerOneByOne(res.answer, questionNumber);
        //  this.typeAnswerOneByOne(formattedAnswer, questionNumber);
      }, err => {
        console.error('AI answer error:', err);
        this.isAnswerTyping = false;
      });
    }
    
    // private formatAnswer(raw: string): string {
    // if (!raw) return '';

    // // 1. Normalize <br> and newlines
    // let formatted = raw.replace(/<br\s*\/?>/gi, '\n');
    // formatted = formatted.replace(/\r\n|\r/g, '\n');

    // // 2. Split into lines
    // const lines = formatted.split('\n').map(line => line.trim()).filter(l => l.length > 0);

    // let finalHtml = '';
    // let inList = false;

    // for (let line of lines) {
    //   // Apply bold formatting 
    //   line = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    //   if (line.startsWith('-')) {
    //     // Bullet point
    //     if (!inList) {
    //       finalHtml += '<ul>';
    //       inList = true;
    //     }
    //     finalHtml += `<li>${line.substring(1).trim()}</li>`;
    //   } else {
    //     // Normal text
    //     if (inList) {
    //       finalHtml += '</ul>'; // close list before normal text
    //       inList = false;
    //     }
    //     finalHtml += `<p>${line}</p>`;
    //   }
    // }

    // if (inList) {
    //   finalHtml += '</ul>'; // close list if still open
    // }

    // return finalHtml.trim();
    // }

    scrollAnswerToBottom() {
      try {
        this.answerContainer.nativeElement.scrollTop = this.answerContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.warn('Auto-scroll failed', err);
      }
    }

    exportTranscript() {
      const formatted = this.transcripts.map(t => `Q${t.question} (${t.time}): ${t.text}`).join('\n\n');
      const blob = new Blob([formatted], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'transcript.txt';
      link.click();
      window.URL.revokeObjectURL(url); // cleanup
    }

    exportChat() {
      const chatText = this.chatHistory.map(c => `Question${c.question}\n🤖 Q.H Robot: ${c.answer}\n`).join('\n');
      const blob = new Blob([chatText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chat_history.txt';
      link.click();
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
}
