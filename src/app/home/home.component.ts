import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, HostListener, inject, OnInit, Renderer2 } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../environments/environment';
import { SeoService } from '../services/seo.service';
import { AnalyticsService } from '../services/analytics.service';
import { SEO_CONFIG } from '../config/seo.config';
import { TranslatePipe } from '../pipes/translate.pipe';
import Swal from 'sweetalert2';
declare var bootstrap: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    isWhiteBg = false;
    selectedPlan: 'month' | 'annual' = 'month'; // For toggling prices
    isMenuOpen: boolean = false;
    freePlan: any = {
      totalSessions: 2,
      totalSessionsMock: 2,
      sessionLength: 20,
      interviewReports: 2,
      recordedMeetings: 0
    };
    standardPlan: any = {
      totalSessions: 100,
      totalSessionsMock: 100,
      sessionLength: 60,
      interviewReports: 100,
      recordedMeetings: 100,
      price: 29
    };
    standardPlanAnnual: any = {
      totalSessions: 100,
      totalSessionsMock: 100,
      sessionLength: 60,
      interviewReports: 100,
      recordedMeetings: 100,
      price: 28
    };
    proPlan: any = {
      price: 49
    };
    proPlanAnnual: any = {
      price: 48
    };
    supportForm!: FormGroup;
    quoteForm!: FormGroup;
    isQuoteSubmitting = false;
    activeTab: string = '';
    message = '';
    isSubmitting = false;
    faqCategoriesChunks: any[][] = [];
    hover: boolean = false;
    private apiUrlSupport = `${environment.apiBaseUrl}/api/SecurityMaster/support-submit`;
  
    constructor(
      private fb: FormBuilder,
      private http: HttpClient,
      private router: Router,
      private renderer: Renderer2,
      private cdRef: ChangeDetectorRef,
      private seoService: SeoService,
      private analyticsService: AnalyticsService
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
        this.applyTheme('light');
        
        const seoConfig = SEO_CONFIG['home'];
        this.seoService.setPageMeta(seoConfig);
        this.seoService.addWebPageSchema(seoConfig.title, seoConfig.description, 'https://quickhired.com');
        this.seoService.addBreadcrumbSchema([
          { name: 'Home', url: 'https://quickhired.com' }
        ]);
        
        const faqItems = this.faqCategories[0].questions.map(q => ({
          question: q.question,
          answer: q.answer
        }));
        this.seoService.addFAQSchema(faqItems);
        
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
      
      applyTheme(theme: string) {
      if (typeof window !== 'undefined' && (window as any).KTThemeMode) {
        (window as any).KTThemeMode.setMode(theme);
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
        this.analyticsService.trackPricingInteraction(planType, 'toggle_plan');

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
    this.analyticsService.trackCTAClick('Get Started', 'home-page');
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
        this.analyticsService.trackFormSubmit('support_form');
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
      title: 'Live Transcription',
      description: 'Capture every word spoken during interviews with real-time transcription.',
      image: 'assets/media/live_transcription.jpg',  
      hover: false
    },
    {
      title: 'Auto Question Detection',
        description: 'Automatically detect and highlight interview questions in real-time.',
        image: 'assets/media/auto_question.jpg',  
        hover: false
      },
      {
        title: 'Personalized AI Copilot',
        description: 'Get a tailored AI assistant based on your resume and role.',
        image: 'assets/media/ai_copilot.jpg', 
        hover: false
      },
      {
        title: 'Interview Question Banks',
        description: 'Practice from an extensive database of industry-specific questions.',
        image: 'assets/media/questions.jpg',  
        hover: false
      },
      {
        title: 'Latest Reasoning Models',
        description: 'Experience smarter support powered by state-of-the-art AI models.',
      image:'assets/media/question_bank.jpg',  
      hover: false
    },
    {
      title: 'Support 25+ Languages',
      description: 'Conduct interviews in your native language with multilingual support.',
      image: 'assets/media/multilanguage.jpg', 
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
