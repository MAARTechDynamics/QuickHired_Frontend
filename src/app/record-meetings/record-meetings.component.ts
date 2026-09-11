import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2'; 
import { environment } from '../environments/environment';
import { IdleTimeOutService } from '../idle-time-out-service';
import { timeout } from 'rxjs/operators';

export enum RecordingState {
  READY = 'ready',
  RECORDING_AUDIO = 'recording-audio',
  RECORDING_VIDEO = 'recording-video',
  COMPLETED = 'completed'
}

export enum RecordingMode {
  AUDIO = 'audio',
  VIDEO = 'video'
}
@Component({
  selector: 'app-record-meetings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './record-meetings.component.html',
  styleUrl: './record-meetings.component.css'
})
export class RecordMeetingsComponent implements OnInit {
  mediaRecorder: any;
  recordedChunks: any[] = [];
  recording = false;
  recordedBlob: Blob | null = null;
  micStream: MediaStream | null = null;
  screenStream: MediaStream | null = null;
  audioOnly = false; // new flag

  companyName: string = '';
  jobTitle: string = '';
  recordStartTime: Date | null = null;
  currentUserEmail: string | null = null;
  userId:string = " ";
  private userApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster`;
  private backendUrl = `${environment.apiBaseUrl}/api/AIInterview/speech-to-text-meeting`;
   currentState: RecordingState = RecordingState.READY;
  recordingMode: RecordingMode = RecordingMode.VIDEO;
  elapsedTime: string = '00:00:00';
  private timer: any;
  private startTime: number = 0;
  private animationFrame: any;
  showWaveform: boolean = false;

  // Enum references for template
  RecordingState = RecordingState;
  RecordingMode = RecordingMode;

 

  ngOnDestroy(): void {
    this.stopTimer();
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  constructor(private http: HttpClient,private renderer: Renderer2 ,private idleService: IdleTimeOutService){}


  ngOnInit(): void {
    this.loadCurrentUser();
    
  }

  private startTimer(): void {
    this.startTime = Date.now();
    this.timer = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      this.elapsedTime = this.formatTime(elapsed);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getRecordingText(): string {
    switch (this.currentState) {
      case RecordingState.RECORDING_AUDIO:
        return 'Recording Audio Session...';
      case RecordingState.RECORDING_VIDEO:
        return 'Recording Video Meeting...';
      case RecordingState.COMPLETED:
        return 'Recording Completed Successfully';
      default:
        return 'Ready to Record';
    }
  }

  getStatusMessage(): string {
    if (this.currentState === RecordingState.COMPLETED) {
      return 'Recording completed';
    }
    return '';
  }
 
  private formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private animateWaveform(): void {
    const waveformElement = document.querySelector('.waveform');
    if (waveformElement && this.showWaveform) {
      // Simple animation for waveform bars
      this.animationFrame = requestAnimationFrame(() => {
        if (this.showWaveform) {
          this.animateWaveform();
        }
      });
    }

  }

  getRecordingIcon(): string {
    switch (this.currentState) {
      case RecordingState.RECORDING_AUDIO:
        return 'fas fa-microphone';
      case RecordingState.RECORDING_VIDEO:
        return 'fas fa-video';
      case RecordingState.COMPLETED:
        return 'fas fa-check';
      default:
        return 'fas fa-microphone';
    }
  }

 



 recordNewMeeting(): void {
    this.currentState = RecordingState.READY;
    this.elapsedTime = '00:00:00';
    this.recordingMode = RecordingMode.VIDEO;
  }

  loadCurrentUser(): void {
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

  async startAudioRecording(mode: RecordingMode): Promise<void> {
    this.idleService.pauseTimeout();

    this.recordStartTime = new Date();
   
    this.audioOnly = true;

    const meetingInfoAdded = await this.promptMeetingInfo();
    if (!meetingInfoAdded) {
      return; 
    }

  
    this.recordingMode = mode;
    this.currentState = mode === RecordingMode.AUDIO 
      ? RecordingState.RECORDING_AUDIO 
      : RecordingState.RECORDING_VIDEO;
    
    this.startTimer();
    
    if (mode === RecordingMode.AUDIO) {
      this.showWaveform = true;
      this.animateWaveform();
    }

  try {
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.micStream);
    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (event: any) => {
      if (event.data.size > 0) this.recordedChunks.push(event.data);
    };

    this.mediaRecorder.start();
    this.recording = true;
  } catch (err) {
    alert('Audio recording failed. Please allow microphone access.');
  }
}

  
  // async startRecording() {
  //   try {
  //     this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  //     this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  //     const audioContext = new AudioContext();
  //     const destination = audioContext.createMediaStreamDestination();
  //     const micSource = audioContext.createMediaStreamSource(this.micStream);
  //     const displayAudioSource = audioContext.createMediaStreamSource(this.screenStream);

  //     micSource.connect(destination);
  //     displayAudioSource.connect(destination);

  //     const combinedAudioStream = destination.stream;

  //     this.mediaRecorder = new MediaRecorder(combinedAudioStream);
  //     this.recordedChunks = [];

  //     this.mediaRecorder.ondataavailable = (event: any) => {
  //       if (event.data.size > 0) {
  //         this.recordedChunks.push(event.data);
  //       }
  //     };

  //     this.mediaRecorder.start();
  //     this.recording = true;
  //   } catch (err) {
  //     console.error('Error accessing screen recording or microphone:', err);
  //     alert('Error accessing screen recording or microphone. Please ensure you have granted the required permissions.');
  //   }
  // }


  async promptMeetingInfo(): Promise<boolean> {
  const { value: formValues, isConfirmed } = await Swal.fire({
    title: 'Enter Meeting Info',
    html: `
      <input id="companyName" class="swal2-input" placeholder="Meeting Title">
    `,
    showCancelButton: true, 
    confirmButtonText: 'Start Recording',
    cancelButtonText: 'Cancel',
    preConfirm: () => {
      const company = (document.getElementById('companyName') as HTMLInputElement)?.value;
      this.companyName = company;
      if (!company) {
        Swal.showValidationMessage('Meeting Title is required.');
        return false;
      }
      return { company };
    }
  });

  return isConfirmed && !!formValues?.company;
}

async startRecording(mode: RecordingMode): Promise<void> {
  this.idleService.pauseTimeout();

  this.recordStartTime = new Date();

  this.audioOnly = false;
  
  const meetingInfoAdded = await this.promptMeetingInfo();
  if (!meetingInfoAdded) {
    return; 
  }
  try {
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    const micSource = audioContext.createMediaStreamSource(this.micStream);
    const displayAudioSource = audioContext.createMediaStreamSource(this.screenStream);

    micSource.connect(destination);
    displayAudioSource.connect(destination);

    const combinedAudioStream = destination.stream;
    this.mediaRecorder = new MediaRecorder(combinedAudioStream);
    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (event: any) => {
      if (event.data.size > 0) this.recordedChunks.push(event.data);
    };

    this.mediaRecorder.start();

   
    this.recordingMode = mode;
    this.currentState = mode === RecordingMode.AUDIO
      ? RecordingState.RECORDING_AUDIO
      : RecordingState.RECORDING_VIDEO;

    this.startTimer();
    if (mode === RecordingMode.AUDIO) {
      this.showWaveform = true;
      this.animateWaveform();
    }

    this.recording = true;
  } catch (err) {
     Swal.fire({
      icon: 'warning',
      title: 'Screen Recording Not Supported',
      html: `
        <p style="font-size:15px; line-height:1.5;">
          Screen recording is not supported on mobile devices.<br>
          You can still record <b>audio only</b> using the audio recording option.
        </p>
      `,
      confirmButtonText: 'Got it',
      confirmButtonColor: '#3085d6'
    });
  }
}
 
stopRecording() {
  this.idleService.resumeTimeout();
  if (this.mediaRecorder) {
    this.mediaRecorder.stop();
    this.mediaRecorder.onstop = () => this.handleRecordingComplete();
  }
   this.stopTimer();
    this.showWaveform = false;
    this.currentState = RecordingState.COMPLETED;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }


  this.recording = false;
  this.audioOnly = false; 

  if (this.micStream) this.micStream.getTracks().forEach(track => track.stop());
  if (this.screenStream) this.screenStream.getTracks().forEach(track => track.stop());
}

  handleRecordingComplete() {
    this.recordedBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
    if (this.recordedBlob) {
      Swal.fire({
        title: 'Download Recording?',
        showCancelButton: true,
        confirmButtonText: 'Yes, download it!'
      }).then(async result => {
        if (result.isConfirmed) {
          const url = URL.createObjectURL(this.recordedBlob!);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${this.companyName}-recording.webm`;
          link.click();
          URL.revokeObjectURL(url);
        }

        this.exportSummary();
      });
    }
  }

private blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip "data:text/plain;base64,"
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async exportSummary() {
  if (!this.recordedBlob) return;
  this.idleService.pauseTimeout();
  
  const compressedBlob = await this.convertToMp3(this.recordedBlob);

  // Split into 5MB chunks
  const chunkSize = 5 * 1024 * 1024; // 5 MB
  const totalChunks = Math.ceil(compressedBlob.size / chunkSize);
  const sessionId = Date.now().toString(); // Unique per upload


  Swal.fire({
    title: 'Generating Meeting Summary...',
    html: `
      <div style="font-size:15px; margin-top:8px; color:#444;">
        Please wait while we process your meeting recording and generate the summary.<br><br>
        <b>This may take a few minutes for long meetings (up to 2 hours).</b><br><br>
       
        <div style="margin-top:10px;">
          <button id="skipProcessingBtn" class="swal2-confirm swal2-styled" 
            style="background-color:#6c757d !important; border:none; font-size:14px; padding:6px 15px;">
            Skip & Continue Working
          </button>
        </div>
      </div>
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    background: '#f9f9f9',
    didOpen: () => {
      Swal.showLoading();
      
      //  Add skip button functionality
      const skipBtn = document.getElementById('skipProcessingBtn');
      if (skipBtn) {
        skipBtn.addEventListener('click', () => {
          Swal.close(); // close popup but keep process running
        });
      }
    },
  });

  //  Upload chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min((i + 1) * chunkSize, compressedBlob.size);
    const chunk = compressedBlob.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk, `chunk_${i}.mp3`);
    formData.append('index', i.toString());
    formData.append('total', totalChunks.toString());
    formData.append('sessionId', sessionId);

    try {
      await this.http.post(`${environment.apiBaseUrl}/api/AIInterview/upload-chunk`, formData).toPromise();

      // Update progress text
      const progressEl = document.getElementById('upload-progress');
      if (progressEl) progressEl.innerText = `Uploaded chunk ${i + 1} of ${totalChunks}`;
    } catch (err) {
      Swal.close();
      console.error('Chunk upload failed:', err);
      Swal.fire('Error', 'Failed to upload chunk. Please try again.', 'error');
      return;
    }
  }

  //  Process and generate summary
  try {
    const response = await this.http
      .post<{ transcript: BlobPart; summary: string }>(
        `${environment.apiBaseUrl}/api/AIInterview/merge-and-process`,
        { sessionId }
      )
      .toPromise();

    Swal.close();

    // Download summary
    const result = response!;
    const blob = new Blob([result.summary], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.companyName}-MeetingSummary.txt`;
    link.click();
    URL.revokeObjectURL(link.href);

    // Duration calculation
    const totalSeconds = Math.round((Date.now() - this.recordStartTime!.getTime()) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const durationFormatted = hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;

    // Prepare files
    const summaryFileName = `${this.companyName}-MeetingSummary.txt`;
    const fileBlob = new Blob([result.summary], { type: 'text/plain' });
    const transcriptFileName = `${this.companyName}-MeetingTranscript.txt`;
    const transcriptBlob = new Blob([result.transcript], { type: 'text/plain' });

    const summaryBase64 = await this.blobToBase64(fileBlob);
    const transcriptBase64 = await this.blobToBase64(transcriptBlob);

    // Save to DB
    const meetingData = {
      userId: this.userId,
      companyName: this.companyName,
      jobTitle: 'Developer',
      duration: durationFormatted,
      createdAt: new Date().toISOString(),
      summary: 'Downloaded',
      summaryFileName,
      summaryFileBase64: summaryBase64,
      transcriptFileName,
      transcriptFileBase64: transcriptBase64,
    };

    await this.http.post(`${environment.apiBaseUrl}/api/MeetingRecord/save-recording`, meetingData)
      .pipe(timeout(3600000))
      .toPromise();

    // Success message
    Swal.fire({
      title: 'Summary Exported! 🎉',
      text: 'Your meeting summary has been successfully generated, downloaded, and saved.',
      icon: 'success',
      confirmButtonText: 'Got it',
      confirmButtonColor: '#3085d6',
      background: '#f9f9f9',
    });

  } catch (err) {
    Swal.close();
    console.error('Error during merge or summary:', err);
    Swal.fire('Error!', 'Failed to generate meeting summary. Please try again later.', 'error');
  }
  this.idleService.resumeTimeout();
}

async convertToMp3(blob: Blob): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();

    // Convert rendered audioBuffer to WAV, then MP3
    const wavBuffer = await this.audioBufferToWav(renderedBuffer);
    const mp3Blob = new Blob([wavBuffer], { type: 'audio/mp3' });
    return mp3Blob;
  } catch (error) {
    console.error('Audio compression failed:', error);
    return blob; // fallback to original if conversion fails
  }
}


async audioBufferToWav(buffer: AudioBuffer): Promise<ArrayBuffer> {
  const numOfChan = buffer.numberOfChannels,
    length = buffer.length * numOfChan * 2 + 44,
    bufferArray = new ArrayBuffer(length),
    view = new DataView(bufferArray),
    channels = [],
    sampleRate = buffer.sampleRate;

  let offset = 0;
  const writeString = (str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
    offset += str.length;
  };

  writeString('RIFF');
  view.setUint32(offset, 36 + buffer.length * numOfChan * 2, true);
  offset += 4;
  writeString('WAVE');
  writeString('fmt ');
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, numOfChan, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, sampleRate * 2 * numOfChan, true);
  offset += 4;
  view.setUint16(offset, numOfChan * 2, true);
  offset += 2;
  view.setUint16(offset, 16, true);
  offset += 2;
  writeString('data');
  view.setUint32(offset, buffer.length * numOfChan * 2, true);
  offset += 4;

  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let interleaved = new Float32Array(buffer.length * numOfChan);
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numOfChan; ch++) {
      interleaved[i * numOfChan + ch] = channels[ch][i];
    }
  }

  let index = 44;
  for (let i = 0; i < interleaved.length; i++, index += 2) {
    let s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return bufferArray;
}


  
}
