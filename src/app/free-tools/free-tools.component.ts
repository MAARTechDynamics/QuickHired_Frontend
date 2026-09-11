import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment';
export interface ResumeHeader {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

@Component({
  selector: 'app-free-tools',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule,FormsModule],
  templateUrl: './free-tools.component.html',
  styleUrl: './free-tools.component.css'
})
export class FreeToolsComponent implements OnInit {
  
  @Input() resumeHeader?: ResumeHeader;
  @Input() summary?: string;
  @Input() projects?: Array<{ name?: string }>;

  selectedTool: 'cover' | 'thanks' | 'follow' | 'recruit' = 'cover';

  loading = false;
  errorMsg = '';

  commonForm!: FormGroup;
  coverForm!: FormGroup;
  thanksForm!: FormGroup;
  followForm!: FormGroup;
  recruitForm!: FormGroup;

  output = '';
  private readonly LS_KEY = 'career_free_tools_v1';

  constructor(private fb: FormBuilder, private http: HttpClient ){}

  ngOnInit(): void {
    // Forms
    this.commonForm = this.fb.group({
      name: [this.resumeHeader?.name ?? '', Validators.required],
      email: [this.resumeHeader?.email ?? '', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      company: ['', Validators.required],
      contact: [''],
      tone: ['concise'] // concise | warm | formal
    });

    this.coverForm = this.fb.group({
      jd: [''],           // job description
      highlights: ['']    // one per line
    });

    this.thanksForm = this.fb.group({
      to: [''],           // interviewer names
      focus: [''],       
      moment: ['']        
    });

    this.followForm = this.fb.group({
      to: [''],           // recipient
      when: [''],         // when you last spoke
      ask: ['']           
    });

    this.recruitForm = this.fb.group({
      to: [''],           // recruiter name
      targetRole: [''],   // target team/role
      fit: ['']           
    });

    // Load any saved state
    this.loadFromStorage();

   
    if (this.resumeHeader) {
      this.commonForm.patchValue({
        name: this.resumeHeader.name ?? '',
        email: this.resumeHeader.email ?? ''
      }, { emitEvent: false });
    }
  }

  setTool(tool: 'cover' | 'thanks' | 'follow' | 'recruit') {
    this.selectedTool = tool;
    this.saveToStorage();
  }
  
  async generate() {
    this.loading = true;
    this.errorMsg = '';
    this.output = '';
     Swal.fire({
      title: 'Generating...',
      text: 'Please wait while we prepare your content.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
     // Mapping tool for success message
      const toolNames: any = {
      cover: 'Cover Letter',
      thanks: 'Thank You Email',
      follow: 'Follow-up Email',
      recruit: 'Recruiter Outreach'
      };
    // build request payload
    const payload: any = {
      tool: this.selectedTool,
      tone: this.commonForm.value.tone || 'concise',
      common: {
        name: (this.commonForm.value.name || '').trim(),
        email: (this.commonForm.value.email || '').trim(),
        role: (this.commonForm.value.role || '').trim(),
        company: (this.commonForm.value.company || '').trim(),
        contact: (this.commonForm.value.contact || '').trim()
      },
      specific: {}
    };

    if (this.selectedTool === 'cover') {
      payload.specific = {
        jd: (this.coverForm.value.jd || '').trim(),
        highlights: (this.coverForm.value.highlights || '').trim()
      };
    } else if (this.selectedTool === 'thanks') {
      payload.specific = {
        to: (this.thanksForm.value.to || '').trim(),
        focus: (this.thanksForm.value.focus || '').trim(),
        moment: (this.thanksForm.value.moment || '').trim()
      };
    } else if (this.selectedTool === 'follow') {
      payload.specific = {
        to: (this.followForm.value.to || '').trim(),
        when: (this.followForm.value.when || '').trim(),
        ask: (this.followForm.value.ask || '').trim()
      };
    } else if (this.selectedTool === 'recruit') {
      payload.specific = {
        to: (this.recruitForm.value.to || '').trim(),
        targetRole: (this.recruitForm.value.targetRole || '').trim(),
        fit: (this.recruitForm.value.fit || '').trim()
      };
    }

   
    try {
      const resp: any = await this.http.post(`${environment.apiBaseUrl}/api/AIInterview/generate`, payload).toPromise();
      if (resp && resp.output) {
        this.output = resp.output;
        setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: `${toolNames[this.selectedTool]} Generated!`,
        text: `Your ${toolNames[this.selectedTool]} has been generated successfully.`,
        timer: 2000,
        showConfirmButton: false
      });
    }, 300);
      } else {
        // fallback to local generation if backend returns nothing
        this.output = this.localGenerate();
        setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: `${toolNames[this.selectedTool]} Generated!`,
        text: `Your ${toolNames[this.selectedTool]} has been generated successfully.`,
        timer: 2000,
        showConfirmButton: false
      });
    }, 300);
      }
    } catch (err) {
      console.error('Backend generate error', err);
      this.errorMsg = 'Auto-generation failed — using local template.';
      // fallback to local generation
      this.output = this.localGenerate();
       Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong while generating.'
      });
    
    } finally {
      this.loading = false;
      this.saveToStorage();
    }
  }

  // keep the older local static generation but extracted to function for fallback
  private localGenerate(): string {
    const { greet, close } = this.toneModifiers(this.commonForm.value.tone);
    const name = this.commonForm.value.name?.trim() || '';
    const email = this.commonForm.value.email?.trim() || '';

    if (this.selectedTool === 'cover') {
      const role = this.commonForm.value.role?.trim() || 'the role';
      const company = this.commonForm.value.company?.trim() || 'your company';
      const contact = this.commonForm.value.contact?.trim() || 'Hiring Team';
      const jd = (this.coverForm.value.jd || '').trim();
      const hiLines = (this.coverForm.value.highlights || '')
        .split('\n').map((s: string) => s.trim()).filter(Boolean);

      const bullets = hiLines.length ? hiLines.map((b: any) => `• ${b}`).join('\n')
                                     : '• Relevant experience aligning with the JD';

      const projectName = this.projects?.[0]?.name || 'a recent project';
      const sum = this.summary || 'I build reliable software and measure impact.';

      return `${greet} ${contact},

      I'm interested in the ${role} role at ${company}. What this really means is I can help you ship faster without breaking things.

      Here’s the thing: after reviewing the job description, a few matches stood out:

      ${bullets}

      A bit more context: ${sum}

      If it helps, I can walk through ${projectName} and the decisions behind it.

      ${close},
      ${name}
      ${email}`;
    }

    if (this.selectedTool === 'thanks') {
      const to = this.thanksForm.value.to?.trim() || 'Team';
      const focus = this.thanksForm.value.focus?.trim() || 'our conversation';
      const moment = this.thanksForm.value.moment?.trim();

      return `${greet} ${to},

      Thanks for the time today. I enjoyed ${focus}${moment ? `—especially ${moment}` : ''}. The role lines up with where I do my best work.

      If anything else would help—references, code samples, deeper dives—happy to send.

      ${close},
      ${name}
      ${email}`;
          }

          if (this.selectedTool === 'follow') {
            const to = this.followForm.value.to?.trim() || 'there';
            const when = this.followForm.value.when?.trim() || 'our recent conversation';
            const ask = this.followForm.value.ask?.trim() || 'next steps';

            return `${greet} ${to},

      Quick follow-up on ${when}. Any updates on ${ask}?

      Happy to provide anything else you need.

      ${close},
      ${name}
      ${email}`;
    }

    if (this.selectedTool === 'recruit') {
      const to = this.recruitForm.value.to?.trim() || 'there';
      const company = this.commonForm.value.company?.trim() || 'your company';
      const targetRole = this.recruitForm.value.targetRole?.trim()
                        || this.commonForm.value.role?.trim()
                        || 'Software Engineer';
      const fitLines = (this.recruitForm.value.fit || '')
        .split('\n').map((s: string) => s.trim()).filter(Boolean);
      const bullets = fitLines.length
        ? fitLines.map((b: any) => `• ${b}`).join('\n')
        : '• Experience shipping production systems\n• Strong communication and ownership';

      return `${greet} ${to},

      I’m exploring ${targetRole} opportunities at ${company}. A few quick reasons I might be a fit:

      ${bullets}

      Open to a quick chat if helpful.

      ${close},
      ${name}
      ${email}`;
    }

    return '';
  }
  copy() {
  if (!this.output) return;

  console.log('Output to copy:', this.output);

  // if (!navigator.clipboard) {
  //   console.error('Clipboard API not supported or not available in this context.');
  //   Swal.fire({
  //     icon: 'error',
  //     title: 'Clipboard Not Supported',
  //     text: 'Your browser does not support clipboard API. Please use HTTPS or update your browser.'
  //   });
  //   return;
  // }

  navigator.clipboard.writeText(this.output)
    .then(() => {
      console.log('Copied successfully!');
      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Your content has been copied to clipboard.',
        timer: 2000,
        showConfirmButton: false
      });
    })
    .catch(err => {
      console.error('Clipboard error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Failed to copy. Please try again.'
      });
    });
}



  downloadTxt() {
    if (!this.output) return;
    const fileName =
      this.selectedTool === 'cover'   ? 'cover-letter.txt' :
      this.selectedTool === 'thanks'  ? 'thank-you-email.txt' :
      this.selectedTool === 'follow'  ? 'follow-up-email.txt' :
                                        'recruiter-outreach.txt';

    const blob = new Blob([this.output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = fileName; 
    a.click();
    URL.revokeObjectURL(url);

    // SweetAlert success after download
    Swal.fire({
      icon: 'success',
      title: 'Downloaded!',
      text: `${fileName} has been downloaded successfully.`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  print() {
    window.print();
  }

  private toneModifiers(tone: 'concise'|'warm'|'formal') {
    switch (tone) {
      case 'warm':   return { greet: 'Hi',   close: 'Best regards' }
      case 'formal': return { greet: 'Dear', close: 'Sincerely' };
      default:       return { greet: 'Hi',   close: 'Best' };
    }
  }

  private saveToStorage() {
    const data = {
      common: this.commonForm.value,
      cover: this.coverForm.value,
      thanks: this.thanksForm.value,
      follow: this.followForm.value,
      recruit: this.recruitForm.value,
      selectedTool: this.selectedTool,
      output: this.output
    };
    localStorage.setItem(this.LS_KEY, JSON.stringify(data));
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.LS_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data?.common)  this.commonForm.patchValue(data.common, { emitEvent: false });
      if (data?.cover)   this.coverForm.patchValue(data.cover, { emitEvent: false });
      if (data?.thanks)  this.thanksForm.patchValue(data.thanks, { emitEvent: false });
      if (data?.follow)  this.followForm.patchValue(data.follow, { emitEvent: false });
      if (data?.recruit) this.recruitForm.patchValue(data.recruit, { emitEvent: false });
      if (data?.selectedTool) this.selectedTool = data.selectedTool;
      if (data?.output) this.output = data.output;
    } catch { /* ignore */ }
  }
}

