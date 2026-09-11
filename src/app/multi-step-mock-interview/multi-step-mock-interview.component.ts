import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment';
declare var bootstrap: any;
interface FormDataView {
  jobDescription: string;
  companyName: string;
  jobTitle: string;
  domain: string;
  duration: string;
}

@Component({
  selector: 'app-multi-step-mock-interview',
  standalone: true,
  imports: [HttpClientModule, RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './multi-step-mock-interview.component.html',
  styleUrl: './multi-step-mock-interview.component.css'
})
export class MultiStepMockInterviewComponent implements OnInit {
   ngAfterViewInit() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map((tooltipTriggerEl: any) => {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    })
  }
 
  isSubmitting = false;
  submitErrorMessage = '';
  currentUserEmail: string | null = null;
  userId: string = '';

 
  planSessionLimit = 0;
  userLiveSessionsCount = 0;
  maxSessionDuration = 0; // in minutes
  selectedDuration: number | null = null;
  formSubmitted = false;
  uploadedFileName: string = '';

 
  features = [
    'Industry-specific questions tailored to your role',
    'Real-time AI feedback on your responses',
    'Behavioral and technical interview preparation',
    'Performance analytics and improvement tips',
    'Practice anytime, anywhere with flexible sessions'
  ];

  // Domain & Duration options
  domains = [
    { id: 'general', name: 'General', icon: '�' },
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'marketing', name: 'Marketing', icon: '📈' },
    { id: 'finance', name: 'Finance', icon: '💳' },
    { id: 'sales', name: 'Sales', icon: '🚀' },
    { id: 'hr', name: 'HR', icon: '🤝' }
  ];

  durations = [
    { id: '15m', name: '15m', label: 'Quick' },
    { id: '30m', name: '30m', label: 'Standard' },
    { id: '60m', name: '60m', label: 'Complete' }
  ];

 
  formData: FormDataView = {
    jobDescription: '',
    companyName: '',
    jobTitle: '',
    domain: 'general',
    duration: '15m'
  };


  personaForm!: FormGroup;

  private http = inject(HttpClient);
  private userApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster`;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.personaForm = this.fb.group({
      unique_cv: [null, Validators.required],
      company_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      // company_description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
      job_title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      job_description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
      domain: ['general', Validators.required],
      // store minutes (number) directly for easy query param usage
      sessionDuration: [15, Validators.required]
    });


    setTimeout(() => this.loadUserSubscriptionDetails(), 500);
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
  loadUserSubscriptionDetails() {
    if (!this.userId) return;
    this.http.get<any>(`${environment.apiBaseUrl}/api/Membership/user-plan/${this.userId}`).subscribe({
      next: (res) => {
        this.planSessionLimit = res.totalSessionsMock;    // e.g., 3
        this.maxSessionDuration = res.sessionLength;  // e.g., 30
        this.checkUserLiveSessionCount();
      },
      error: (err) => console.error('Subscription fetch error', err)
    });
  }
  checkUserLiveSessionCount() {
    if (!this.userId) return;
    this.http.get<any[]>(`${environment.apiBaseUrl}/api/Membership/user-sessions/${this.userId}`).subscribe({
      next: (res) => {
        this.userLiveSessionsCount = res.filter(x => x.interviewType === 'Mock').length;
        if (this.userLiveSessionsCount >= this.planSessionLimit) {
          this.showPlanLimitReachedPopup();
        }
      },
      error: (err) => console.error('Error fetching user sessions', err)
    });
  }

  showPlanLimitReachedPopup() {
    Swal.fire({
      icon: 'warning',
      title: 'Plan Limit Reached',
      text: 'You have used all your allowed interview sessions. Please upgrade your plan to schedule more.',
      confirmButtonText: 'Upgrade Plan',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: false
    }).then((result) => {
      if (result.isConfirmed) this.router.navigate(['/pricing']);
    });
  }


  isDurationEnabled(durationMinutes: number): boolean {
    return this.maxSessionDuration ? durationMinutes <= this.maxSessionDuration : true;
  }
  selectDomain(domainId: string) {
    this.personaForm.patchValue({ domain: domainId });
    this.formData.domain = domainId; 
    this.personaForm.get('domain')?.markAsTouched();
  }
  selectDuration(durationId: string) {
    const minutes = parseInt(durationId.replace('m', ''), 10);
    this.personaForm.patchValue({ sessionDuration: minutes });
    this.formData.duration = durationId;
    this.selectedDuration = minutes;
    this.personaForm.get('sessionDuration')?.markAsTouched();
  }

  // quickStartInterview() {
  //   // Pre-fill domain & duration; user still needs required fields to submit.
  //   this.selectDomain('general');
  //   this.selectDuration('30m');
    
  // }

 quickStartInterview() {
  if (!this.currentUserEmail) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Something went wrong. Please try again later.'
    });
    return;
  }

  this.isSubmitting = true;

  // Dummy resume file
  const dummyResumeContent = new Blob(
    ["This is a quick start dummy resume."],
    { type: "application/pdf" }
  );
  const dummyFile = new File([dummyResumeContent], "quickstart_resume.pdf", { type: "application/pdf" });

  const fd = new FormData();
  fd.append('ResumeFile', dummyFile);
  fd.append('CompanyName', 'Quick Start Company');
  fd.append('CompanyDescription', 'Quick start interview mode');
  fd.append('JobTitle', 'Quick Start Job');
  fd.append('JobDescription', 'Quick start job description');
  fd.append('UserId', this.userId);
  fd.append('InterviewDomain', 'general');
  fd.append('InterviewType', 'Mock');

  this.http.post(`${environment.apiBaseUrl}/api/AIInterview/create-persona`, fd, { withCredentials: true })
    .subscribe({
      next: () => {
        this.isSubmitting = false;
        const time = 30;
        this.router.navigate(['/interview'], { queryParams: { time } });
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error:', err);

        // Show SweetAlert popup with backend error
        Swal.fire({
          icon: 'error',
          title: 'Failed to Start Mock Interview',
          text: err?.error || 'Something went wrong. Please try again later.'
        });
      }
    });
  }

  resetForm() {
    this.personaForm.reset({
      domain: 'general',
      sessionDuration: 15
    });
    this.formData = {
      jobDescription: '',
      companyName: '',
      jobTitle: '',
      domain: 'general',
      duration: '30m'
    };
    this.selectedDuration = null;
    this.uploadedFileName = '';
    this.formSubmitted = false;
    
    // Clear file input
    const fileInput = document.getElementById('resumeUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please upload a PDF, DOC, or DOCX file.'
        });
        input.value = '';
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please upload a file smaller than 5MB.'
        });
        input.value = '';
        return;
      }
      
      this.uploadedFileName = file.name;
      this.personaForm.patchValue({ unique_cv: file });
      this.personaForm.get('unique_cv')?.updateValueAndValidity();
      this.personaForm.get('unique_cv')?.markAsTouched();
    }
  }

 parseInt10(value: string): number {
  return parseInt(value, 10);
 }

  // Helper methods for validation display
  shouldShowError(fieldName: string): boolean {
    const field = this.personaForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.formSubmitted));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.personaForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      switch(fieldName) {
        case 'unique_cv': return 'Please upload your resume';
        case 'company_name': return 'Company name is required';
        case 'job_title': return 'Job title is required';
        case 'job_description': return 'Job description is required';
        case 'domain': return 'Please select an interview domain';
        case 'sessionDuration': return 'Please select a session duration';
        default: return 'This field is required';
      }
    }

    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Must be at least ${minLength} characters`;
    }

    if (field.errors['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `Must be no more than ${maxLength} characters`;
    }

    return 'Invalid input';
  }
  submitPersonaForm() {
  if (this.personaForm.invalid) {
    this.formSubmitted = true;
    this.personaForm.markAllAsTouched();
    Swal.fire({
      icon: 'warning',
      title: 'Required Fields Missing',
      text: 'Please complete all required fields before starting your mock interview.'
    });
    return;
  }
  if (!this.currentUserEmail) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Something went wrong. Please try again later.'
    });
    return;
  }

  this.isSubmitting = true;

  const fd = new FormData();
  fd.append('ResumeFile', this.personaForm.get('unique_cv')?.value);
  fd.append('CompanyName', this.personaForm.get('company_name')?.value);
  fd.append('CompanyDescription', 'Static Company Description');
  fd.append('JobTitle', this.personaForm.get('job_title')?.value);
  fd.append('JobDescription', this.personaForm.get('job_description')?.value);
  fd.append('UserId', this.userId);
  fd.append('InterviewDomain', this.personaForm.get('domain')?.value);
  fd.append('InterviewType', 'Mock');

  this.http.post(`${environment.apiBaseUrl}/api/AIInterview/create-persona`, fd, { withCredentials: true })
    .subscribe({
      next: () => {
        this.isSubmitting = false;
        const time = this.personaForm.get('sessionDuration')?.value;
        this.router.navigate(['/mock-interview'], { queryParams: { time } });
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error:', err);

        Swal.fire({
          icon: 'error',
          title: 'Failed to Start Mock Interview',
          text: err?.error || 'Something went wrong. Please try again later.'
        });
      }
    });
}

}
