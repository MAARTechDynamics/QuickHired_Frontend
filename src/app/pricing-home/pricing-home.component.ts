import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, HostListener, inject, OnInit, Renderer2 } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../environments/environment';
import { Title, Meta } from '@angular/platform-browser';
import Swal from 'sweetalert2';
declare var bootstrap: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './pricing-home.component.html',
  styleUrl: './pricing-home.component.css'
})
export class PricingHomeComponent implements OnInit {
  isWhiteBg = false;
  selectedPlan: 'month' | 'annual' = 'month'; // For toggling prices
 
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
        this.titleService.setTitle('Pricing Plans - AI Interview Copilot Plans | QuickHired');
        
        this.metaService.updateTag({ 
          name: 'description', 
          content: 'Choose the perfect QuickHired plan for your interview preparation. Free, Standard, and Pro plans with AI interview copilot, mock interviews, and unlimited sessions. Flexible monthly and annual pricing options.' 
        });
        
        this.metaService.updateTag({ 
          name: 'keywords', 
          content: 'interview copilot pricing, AI interview plans, mock interview pricing, interview preparation cost, QuickHired pricing, interview tool subscription, AI copilot plans, interview software pricing' 
        });

        // Open Graph tags
        this.metaService.updateTag({ property: 'og:title', content: 'Pricing Plans - AI Interview Copilot Plans | QuickHired' });
        this.metaService.updateTag({ property: 'og:description', content: 'Choose the perfect plan for your interview preparation. Free, Standard, and Pro plans available.' });
        this.metaService.updateTag({ property: 'og:type', content: 'website' });
        this.metaService.updateTag({ property: 'og:url', content: 'https://quickhired.com/pricing-home' });
        this.metaService.updateTag({ property: 'og:image', content: 'https://quickhired.com/assets/media/logos/QuickHireBlack.png' });

        // Twitter Card tags
        this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
        this.metaService.updateTag({ name: 'twitter:title', content: 'Pricing Plans - AI Interview Copilot' });
        this.metaService.updateTag({ name: 'twitter:description', content: 'Choose the perfect plan for your interview preparation.' });

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
        category: 'Pricing',
        questions: [
          {
            question: 'What’s included in the Free Plan?',
            answer: `The Free Plan gives you access to 3 AI interview sessions, 5 mock interviews, unlimited question banks, and basic performance analytics. It’s perfect for exploring the platform before upgrading.`,
            expanded: false
          },
          {
            question: 'Can I cancel or change my subscription anytime?',
            answer: `Yes, you can cancel, pause, or switch your subscription plan at any time directly from your Quick Hired dashboard—no long-term commitments required.`,
            expanded: false
          },
          {
            question: 'What is your refund policy?',
            answer: `We offer a 7-day money-back guarantee for all new premium users. If you're not satisfied, simply request a refund within the first week of purchase.`,
            expanded: false
          },
          {
            question: 'What payment methods do you accept?',
            answer: `Quick Hired uses Stripe to securely process payments. We accept major credit/debit cards including Visa, Mastercard, American Express, and more.`,
            expanded: false
          },
          {
            question: 'Do I need a credit card to try the Free Plan?',
            answer: `No credit card is required to start using the Free Plan. You can explore the core features of Quick Hired without entering any payment information.`,
            expanded: false
          },
          {
            question: 'Are there discounts for students or teams?',
            answer: `Yes, we offer exclusive discounts for students, universities, and teams. Please contact our support team with your details to receive a custom offer.`,
            expanded: false
          },
          {
            question: 'What happens if my payment fails or expires?',
            answer: `If your payment fails, you’ll be notified via email and given a grace period to update your billing info. Your premium access will pause until payment is resolved.`,
            expanded: false
          }
        ]
      }
      ];

      features = [
      {
        title: 'Live Transcription',
        description: 'Capture every word spoken during interviews with real-time transcription.',
        image: '/assets/media/features/auto-question.png' ,
        hover: false
      },
      {
        title: 'Auto Question Detection',
        description: 'Automatically detect and highlight interview questions in real-time.',
        image: '/assets/media/features/auto-question.png',
        hover: false
      },
      {
        title: 'Personalized AI Copilot',
        description: 'Get a tailored AI assistant based on your resume and role.',
        image: '/assets/media/features/ai-copilot.png',
        hover: false
      },
      {
        title: 'Interview Question Banks',
        description: 'Practice from an extensive database of industry-specific questions.',
        image: '/assets/media/features/question-bank.png',
        hover: false
      },
      {
        title: 'Latest Reasoning Models',
        description: 'Experience smarter support powered by state-of-the-art AI models.',
        image: '/assets/media/features/reasoning-models.png',
        hover: false
      },
      {
        title: 'Support 25+ Languages',
        description: 'Conduct interviews in your native language with multilingual support.',
        image: '/assets/media/features/language-support.png',
        hover: false
      }
      ];

      activeTab: string = '';

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
