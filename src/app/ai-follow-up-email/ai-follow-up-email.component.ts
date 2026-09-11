import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, HostListener, inject, OnInit, Renderer2 } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../environments/environment';
import Swal from 'sweetalert2';
declare var bootstrap: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './ai-follow-up-email.component.html',
  styleUrl: './ai-follow-up-email.component.css'
})
export class AIFollowUpEmailComponent implements OnInit {
  isWhiteBg = false;
  selectedPlan: 'month' | 'annual' = 'month';
 
  freePlan: any = null;
  standardPlan: any = null;
  standardPlanAnnual: any = null;
  proPlan: any = null;
  proPlanAnnual: any = null;
  supportForm!: FormGroup;
  quoteForm!: FormGroup;
  isQuoteSubmitting = false;
  message = '';
  isSubmitting = false;
  faqCategoriesChunks: any[][] = [];
  hover: boolean = false;
  activeTab: string = '';
  isMenuOpen: boolean = false;
  private apiUrlSupport = `${environment.apiBaseUrl}/api/SecurityMaster/support-submit`;
  
    constructor(
      private fb: FormBuilder,
      private http: HttpClient,
      private router: Router,
      private renderer: Renderer2,
      private cdRef: ChangeDetectorRef,
      private titleService: Title,
      private metaService: Meta
    ) {
        this.faqCategoriesChunks = this.chunkArray(this.faqCategories, 2);
      }
       @HostListener('document:click', ['$event'])
      onOutsideClick(event: MouseEvent) {
        const menu = document.getElementById('landingNavbar');
        const toggler = document.querySelector('.navbar-toggler');

        const clickedInside =
          menu?.contains(event.target as Node) ||
          toggler?.contains(event.target as Node);

        if (!clickedInside && this.isMenuOpen) {
          menu?.classList.remove('show');
          this.isMenuOpen = false;
        }
      }

      toggleMenu() {
        const menu = document.getElementById('landingNavbar');
        if (menu?.classList.contains('show')) {
          menu.classList.remove('show');
          this.isMenuOpen = false;
        } else {
          menu?.classList.add('show');
          this.isMenuOpen = true;
        }
      }
      isMobileDropdownOpen = {
        features: false,
        resources: false
      };

      toggleMobileDropdown(section: 'features' | 'resources') {
        this.isMobileDropdownOpen[section] = !this.isMobileDropdownOpen[section];
      }
      isMobileView = false;
    ngOnInit() {
      // Set SEO meta tags
      this.titleService.setTitle('AI Follow-Up Email Generator - Recruiter Outreach | QuickHired');

      this.metaService.updateTag({ 
        name: 'description', 
        content: 'Generate compelling follow-up emails to recruiters and hiring managers with AI. Stay top-of-mind with professional, personalized follow-ups that get responses and advance your candidacy.' 
      });

      this.metaService.updateTag({ 
        name: 'keywords', 
        content: 'follow-up email, recruiter email, hiring manager follow-up, job application follow-up, professional email, AI email writer, recruiter outreach, job search emails' 
      });

      // Open Graph tags
      this.metaService.updateTag({ property: 'og:title', content: 'AI Follow-Up Email Generator - Recruiter Outreach' });
      this.metaService.updateTag({ property: 'og:description', content: 'Generate compelling follow-up emails to recruiters and hiring managers with AI.' });
      this.metaService.updateTag({ property: 'og:type', content: 'website' });
      this.metaService.updateTag({ property: 'og:url', content: 'https://quickhired.com/ai-follow-up-email' });
      this.metaService.updateTag({ property: 'og:image', content: 'https://quickhired.com/assets/media/logos/QuickHireBlack.png' });

      // Twitter Card tags
      this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
      this.metaService.updateTag({ name: 'twitter:title', content: 'AI Follow-Up Email Generator - Recruiter Outreach' });
      this.metaService.updateTag({ name: 'twitter:description', content: 'Generate compelling follow-up emails to recruiters and hiring managers with AI.' });

      this.applyTheme('light');
      this.supportForm = this.fb.group({
          name: ['', Validators.required],
          email: ['', [Validators.required, Validators.email]],
          subject: ['', Validators.required],
          message: ['', Validators.required]
        });
        this.quoteForm = this.fb.group({
          userEmail: ['', [Validators.required, Validators.email]],
          userRequirement: ['', Validators.required]
        });
        window.addEventListener('scroll', () => {
          this.isWhiteBg = window.scrollY > 10;
        });
        this.changePlan('month');
        this.fetchPlanData('Free');
        this.fetchPlanData('Standard');
        this.fetchPlanData('Pro'); 
        this.fetchPlanData('StandardAnnual');
        this.fetchPlanData('ProAnnual'); 
         this.isMobileView = window.innerWidth <= 767;
    }
    ngAfterViewInit() {
      const video = document.querySelector('video');
      if (video) {
        video.muted = true;
        video.volume = 0;
      }
    }
    applyTheme(theme: string) {
          if (typeof window !== 'undefined' && (window as any).KTThemeMode) {
            (window as any).KTThemeMode.setMode(theme); // preferred method
          }

          const html = document.documentElement;

          if (theme === 'light') {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('kt_theme_mode_value', 'light');
          } else if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('kt_theme_mode_value', 'dark');
          } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            localStorage.setItem('kt_theme_mode_value', 'system');
          }


          localStorage.setItem('kt_theme_mode', theme);
    }
    
    changePlan(planType: 'month' | 'annual') {
      this.selectedPlan = planType;

      const prices = document.querySelectorAll('[data-kt-plan-price-month]');
      const periods = document.querySelectorAll('[data-kt-plan-price-annual]');

      prices.forEach((element: any) => {
        const monthValue = element.getAttribute('data-kt-plan-price-month');
        const annualValue = element.getAttribute('data-kt-plan-price-annual');

        if (planType === 'month') {
          element.textContent = monthValue;
        } else {
          element.textContent = annualValue;
        }
      });

      periods.forEach((element: any) => {
        const monthValue = element.getAttribute('data-kt-plan-price-month');
        const annualValue = element.getAttribute('data-kt-plan-price-annual');

        if (planType === 'month') {
          element.textContent = monthValue;
        } else {
          element.textContent = annualValue;
        }
      });
    }

    goToLogin() {
      this.router.navigate(['/login']);
    }

    fetchPlanData(planName: string): void {
    const url = `${environment.apiBaseUrl}/api/Membership/get-plan-features/${planName}`;
    this.http.get<any>(url).subscribe({
      next: (data) => {
        if (planName.toLowerCase() === 'free') {
          this.freePlan = data;
        } else if (planName.toLowerCase() === 'standard') {
          this.standardPlan = data;
        }
        else if (planName.toLowerCase() === 'pro') {
          this.proPlan = data;
        }else if (planName.toLowerCase() === 'proannual') {
          this.proPlanAnnual = data;
        }else if (planName.toLowerCase() === 'standardannual') {
          this.standardPlanAnnual = data;
        }
      },
      error: (error) => {
        console.error(`Error loading ${planName} plan features:`, error);
      }
    });
    }
    submitQuoteRequest(): void {
    if (this.quoteForm.invalid) {
      this.quoteForm.markAllAsTouched();
      return;
    }

    this.isQuoteSubmitting = true;
    const formData = this.quoteForm.value;

    this.http.post<any>(`${environment.apiBaseUrl}/SecurityMaster/quote-submit`, formData).subscribe({
      next: (response) => {
        this.isQuoteSubmitting = false;
        this.quoteForm.reset();

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: response.message,
          confirmButtonColor: '#3085d6'
        });

        const modalEl = document.getElementById('quoteModal');
        const modal = bootstrap.Modal.getInstance(modalEl!);
        modal?.hide();
      },
      error: (err) => {
        this.isQuoteSubmitting = false;

        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: err?.error?.message || 'Something went wrong.',
          confirmButtonColor: '#d33'
        });
      }
    });
    }
    submitSupportForm(): void {
            if (this.supportForm.invalid) {
              this.supportForm.markAllAsTouched();
              return;
            }
        
            this.isSubmitting = true;
        
            this.http.post<any>(this.apiUrlSupport, this.supportForm.value).subscribe({
              next: (res) => {
                this.message = res.message;
                this.isSubmitting = false;
                this.supportForm.reset();
        
                Swal.fire({
                  icon: 'success',
                  title: 'Success!',
                  text: 'Your support request has been submitted.',
                  confirmButtonColor: '#3085d6'
                });
        
              
                const modalElement = document.getElementById('kt_modal_new_ticket');
                const modal = bootstrap.Modal.getInstance(modalElement!);
                modal?.hide();
              },
              error: (err) => {
                this.message = err.error?.message || "Something went wrong.";
                this.isSubmitting = false;
        
                Swal.fire({
                  icon: 'error',
                  title: 'Oops...',
                  text: 'Failed to submit support request!',
                  confirmButtonColor: '#d33'
                });
              }
            });
    }
    faqCategories = [
      {
        category: 'General',
        questions: [
          {
            question: 'What is Quick Hired AI Interview Copilot?',
            answer: `Quick Hired's AI Interview Copilot is your smart, real-time assistant during mock interviews. It listens to your responses, gives adaptive follow-up questions, evaluates your tone, content, and confidence, and provides instant feedback — just like a real interviewer would.`,
            expanded: false
          },

          {
            question: 'How does Quick Hired’s AI Interview feature work?',
            answer: `Quick Hired simulates real-time interview scenarios using AI-generated questions tailored to your role and industry. You speak your answers into your mic, and our AI evaluates your responses on fluency, clarity, and relevance.`,
            expanded: false
          },
          {
            question: 'What types of meeting softwares does Quick Hired AI interview copilot support?',
            answer: `Quick Hired AI seamlessly supports all poppular meetings paltforms commonly used for including (but not limited to) Google Meet, Microsoft Teams, Zoom, Skype`,
            expanded: false
          },
          
          {
            question: 'What happens during a Copilot Interview Session, and how does it help me prepare?',
            answer: `The Copilot session is a guided interview experience where Quick Hired provides real-time hints, follow-up questions, and scoring, just like a real interviewer would.`,
            expanded: false
          },
          {
            question: 'Do you support behavioral and technical interviews?',
            answer: `Absolutely. Our AI supports STAR-based behavioral interviews and technical interviews for fields like Software Engineering, Data Science, Marketing, Finance, and more.`,
            expanded: false
          },
        
          {
            question: 'How does the interview scoring system evaluate and calculate your performance?',
            answer: `Quick Hired scores your response based on relevance, tone, confidence, and keyword usage. You receive a detailed performance report after each session.`,
            expanded: false
          },
          {
            question: 'Can I download or share my interview reports to review or get feedback?',
            answer: `Yes, you can download interview reports in PDF format and even share them with mentors or recruiters for feedback.`,
            expanded: false
          },
          {
            question: 'What features and tools are available with the Free Plan?',
            answer: `The Free Plan includes 3 AI interviews and  5 mock interviews sessions , access to un-limited question banks, and basic performance analytics. Upgrade for unlimited sessions and advanced features.`,
            expanded: false
          },
          {
            question: 'Is Quick Hired suitable for remote job interview preparation?',
            answer: `Definitely. Our platform mimics real remote interview settings via webcam and mic, helping users feel confident and prepared for actual virtual interviews.`,
            expanded: false
          }
        ]
      }
    ];

      features = [
    {
      title: 'Time-Saving Cold Emails Writing',
      description: 'Quickly generate cold emails in seconds, saving time while staying professional.',
      image: 'bi bi-stopwatch', 
      hover: false
    },
    {
      title: 'Professional and Polished Cold Emails',
      description: 'Craft refined, well-structured emails that leave a strong impression on any recipient.',
      image: 'bi bi-envelope-paper-fill', 
      hover: false
    },
    {
      title: 'Customizable for Any Job or Recruiter',
      description: 'Easily tailor your email content based on the job role, industry, or recruiter preferences.',
      image: 'bi bi-sliders2-vertical', 
      hover: false
    }
  ];

    
   
   featuresB = [
  {
    title: 'AI Mock Interview',
    description: 'Simulate real interview scenarios with AI-generated questions and instant feedback to boost your readiness.',
    image: 'assets/media/mock.jpg', 
    hover: false
  },
  {
    title: 'AI Interview Copilot',
    description: 'Get real-time support during interviews with intelligent prompts, question analysis, and confidence-boosting guidance.',
    image: 'assets/media/ai_copilot.jpg', 
    hover: false
  },
  {
    title: 'AI Resume Editor',
    description: 'Refine your resume with AI suggestions tailored to your role, experience, and the job description you’re targeting.',
    image: 'assets/media/ai_editor.jpg',
    hover: false
  }
    ];

    

    setActiveTab(tab: string): void {
      this.activeTab = tab;
    }

    chunkArray(arr: any[], size: number): any[][] {
      const result = [];
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
      }
      return result;
    }

    toggleQuestion(q: any, category: any): void {
      if (q.expanded) {
        q.expanded = false;
      } else {
        category.questions.forEach((item: any) => item.expanded = false);
        q.expanded = true;
      }
    }

}

