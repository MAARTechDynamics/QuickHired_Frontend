import { Component, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, OnInit, inject, HostListener } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import { I18nService } from '../services/i18n.service';
import { TranslatePipe } from '../pipes/translate.pipe';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';

declare var bootstrap: any;

@Component({
  selector: 'app-pricing',
  standalone: true, 
  imports: [HttpClientModule, RouterModule, CommonModule, FormsModule],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PricingComponent implements AfterViewInit, OnInit {
  private modalInstance: any;
  private modalInstanceAnnual: any;
  private proModalInstance: any;
  private proModalInstanceAnnual: any;
  private promoModalInstance: any;
  private isModalOpen: boolean = false;
  private http = inject(HttpClient);
  currentUser: any = null; // Store the logged-in user
  private router: Router = new Router;
  selectedPlan: string = 'month';
  userId:string = '';
  private userApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster`;
  private subscriptionApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster/save-subscription`;
  freePlan: any = {
    totalSessions: '3',
    totalSessionsMock: '3',
    sessionLength: '30',
    interviewReports: '3',
    recordedMeetings: '3',
    price: '0'
  };
  standardPlan: any = {
    totalSessions: '10',
    totalSessionsMock: '(per month)',
    sessionLength: '60',
    interviewReports: '10',
    recordedMeetings: '10',
    price: '19'
  };
  standardPlanAnnual: any = {
    totalSessions: '10',
    totalSessionsMock: '(per month)',
    sessionLength: '60',
    interviewReports: '10',
    recordedMeetings: '10',
    price: '220'
  };
  proPlan: any = {
    totalSessions: 'Unlimited',
    totalSessionsMock: 'Unlimited',
    sessionLength: '90',
    interviewReports: 'Unlimited',
    recordedMeetings: 'Unlimited',
    price: '49'
  };
  proPlanAnnual: any = {
    totalSessions: 'Unlimited',
    totalSessionsMock: 'Unlimited',
    sessionLength: '90',
    interviewReports: 'Unlimited',
    recordedMeetings: 'Unlimited',
    price: '570'
  };
  selectedPlanType: 'Pro' | 'ProAnnual' | 'Standard' | 'StandardAnnual' = 'Pro';
  promoCode: string = '';
  validatedPromo: any = null;
  promoError: string = '';
  promoSuccess: string = '';
  isValidatingPromo: boolean = false;
  
  // Landing page navbar properties
  isWhiteBg = false;
  isMenuOpen: boolean = false;
  isMobileDropdownOpen = {
    features: false,
    resources: false
  };
  isMobileView = false;
  activeTab: string = '';
  
  
  constructor(
    private route: ActivatedRoute,
    public i18nService: I18nService
  ) {}

  ngOnInit() {
    this.changePlan('month');
    this.fetchPlanData('Free');
    this.fetchPlanData('Standard');
    this.fetchPlanData('Pro'); 
    this.fetchPlanData('StandardAnnual');
    this.fetchPlanData('ProAnnual'); 

    this.route.queryParams.subscribe(params => {
      const plan = params['plan'];
      if (plan) {
      
        this.loadCurrentUser(() => this.onSubscriptionSuccess(plan));
      } else {
      
        this.loadCurrentUser();
      }
    });
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


  changePlan(planType: 'month' | 'annual') {
    this.selectedPlan = planType;
  
    const prices = document.querySelectorAll('[data-kt-plan-price-month]');
    const periodElements = document.querySelectorAll('[data-kt-element="period"]'); // Select all periods (Mon,Ann)
  
    prices.forEach((priceElement: any) => {
      const monthlyPrice = priceElement.getAttribute('data-kt-plan-price-month');
      const annualPrice = priceElement.getAttribute('data-kt-plan-price-annual');
  
      if (planType === 'month') {
        priceElement.textContent = monthlyPrice;
        periodElements.forEach(period => period.textContent = 'Mon');  // Update all periods (Mon,Ann)
      } else {
        priceElement.textContent = annualPrice;
        periodElements.forEach(period => period.textContent = 'Ann'); // Update all periods (Mon,Ann)
      }
    });
  }
  
  loadCurrentUser(callback?: () => void) {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn("No token found, user not logged in.");
    return;
  }

  let headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  this.http.get<any>(this.userApiUrl, { headers }).subscribe({
    next: (user) => {
      this.currentUser = user.model;
      this.userId = user.model?.userId;
      this.getUserPlan();

      if (callback) {
        callback(); 
      }
    },
    error: (error) => {
      console.error("Error fetching current user:", error);
      localStorage.removeItem('token');
    }
  });
  }

  
  ngAfterViewInit() {
    const modalElement = document.getElementById('stripeModal');
    const modalElementAnnual = document.getElementById('stripeModalAnnual');
    const proModalElement = document.getElementById('stripeModalPro');
    const proModalElementAnnual = document.getElementById('stripeModalProAnnual');
    const promoModalElement = document.getElementById('promoCodeModal');

    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement, {
        backdrop: false,
        keyboard: true
      });
    } else {
      console.error("Stripe Modal not found!");
    }
    if (modalElementAnnual) {
      this.modalInstanceAnnual = new bootstrap.Modal(modalElementAnnual, {
        backdrop: false,
        keyboard: true
      });
    } else {
      console.error("Stripe Modal not found!");
    }
    if (proModalElement) {
      this.proModalInstance = new bootstrap.Modal(proModalElement, {
        backdrop: false,
        keyboard: true
      });
    } else {
      console.error("Stripe Pro Modal not found!");
    }
    if (proModalElementAnnual) {
      this.proModalInstanceAnnual = new bootstrap.Modal(proModalElementAnnual, {
        backdrop: false,
        keyboard: true
      });
    } else {
      console.error("Stripe Pro Modal not found!");
    }
    if (promoModalElement) {
      this.promoModalInstance = new bootstrap.Modal(promoModalElement, {
        backdrop: false,
        keyboard: true
      });
    } else {
      console.error("Promo Code Modal not found!");
    }
  }

 


  // Standard Stripe Modal
  showStripeButton() {
    console.log("Normal Stripe Button Clicked");
    if (this.modalInstance) {
      this.modalInstance.show();
    } else {
      console.error("Stripe Modal instance is not initialized.");
    }
    // this.onSubscriptionSuccess('Standard');
  }
   // Standard Stripe Modal
   showStripeButtonAnnual() {
    console.log("Normal Stripe Button Clicked");
    if (this.modalInstanceAnnual) {
      this.modalInstanceAnnual.show();
    } else {
      console.error("Stripe modal is not initialized.");
    }
    
  }
  // Pro Stripe Modal
  showStripeButtonPro() {
    console.log("Pro Stripe Button Clicked");
    if (this.proModalInstance) {
      this.proModalInstance.show();
    } else {
      console.error("Stripe Pro Modal instance is not initialized.");
    }
  }
  showStripeButtonProAnnual() {
    console.log("Pro Stripe Button Clicked");
    if (this.proModalInstanceAnnual) {
      this.proModalInstanceAnnual.show();
    } else {
      console.error("Stripe Pro Modal instance is not initialized.");
    }
  }
  getUserPlan() {
    if (!this.currentUser || !this.currentUser.email) {
      console.warn("User email not available, cannot fetch plan.");
      return;
    }
  
    const url = `${environment.apiBaseUrl}/api/SecurityMaster/get-user-plan/${this.currentUser.userId}`;
    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.currentUser.planName = response.planName;
        console.log("User Plan:", this.currentUser.planName);
      },
      error: (error) => {
        console.error("Error fetching user plan:", error);
      }
    });
  }
 
  showPromoModal(planType: 'Pro' | 'ProAnnual' | 'Standard' | 'StandardAnnual') {
    // Prevent opening if a modal is already open
    if (this.isModalOpen) {
      return;
    }

    this.selectedPlanType = planType;
    this.promoCode = '';
    this.validatedPromo = null;
    this.promoError = '';
    this.promoSuccess = '';
    this.isValidatingPromo = false;
    this.promoError = '';
    this.promoSuccess = '';
    this.isValidatingPromo = false;

    // Use existing promo modal instance instead of creating new one
    if (this.promoModalInstance) {
      this.isModalOpen = true;
      this.promoModalInstance.show();
      
      // Add event listener to reset flag when modal is hidden
      const modalEl = document.getElementById('promoCodeModal');
      if (modalEl) {
        modalEl.addEventListener('hidden.bs.modal', () => {
          this.isModalOpen = false;
        }, { once: true });
      }
    } else {
      console.error('Promo Modal instance not initialized');
    }
  }


  proceedWithoutPromo() {
    // Use existing promo modal instance
    if (this.promoModalInstance) {
      this.promoModalInstance.hide();
    }
    // Wait for modal to fully close before opening Stripe modal
    setTimeout(() => {
      this.isModalOpen = false;
      this.validatedPromo = null; 
      this.openStripeModal(this.selectedPlanType);
    }, 400); 
  }


  validatePromoCode() {
    if (!this.promoCode?.trim()) {
      this.promoError = 'Please enter a promo code';
      return;
    }

    this.isValidatingPromo = true;
    this.promoError = '';
    this.promoSuccess = '';

    this.http.post(`${environment.apiBaseUrl}/api/PromoCodes/validate`, {
      code: this.promoCode,
      planName: this.selectedPlanType
    }).subscribe({
      next: (res: any) => {
        this.isValidatingPromo = false;
        if (res?.isValid) {
          this.validatedPromo = res;
          this.promoSuccess = `🎉 Success! You've unlocked ${res.discountPercent}% discount! Original: $${res.originalPrice.toFixed(2)}, Your Price: $${res.finalPrice.toFixed(2)}`;
          this.promoError = '';
          
          // Auto-proceed after 2 seconds
          setTimeout(() => {
            if (this.promoModalInstance) {
              this.promoModalInstance.hide();
            }
            this.promoCode = '';
            this.promoSuccess = '';
            this.openStripeModal(this.selectedPlanType);
          }, 2000);

        } else {
          this.promoError = '❌ Invalid or expired promo code. Please try again.';
          this.promoSuccess = '';
        }
      },
      error: () => {
        this.isValidatingPromo = false;
        this.promoError = '❌ Something went wrong. Please try again.';
        this.promoSuccess = '';
      }
    });
  }

  openStripeModal(plan: 'Pro' | 'ProAnnual' | 'Standard' | 'StandardAnnual') {
    // Prevent opening if a modal is already open
    if (this.isModalOpen) {
      return;
    }

    // Use existing modal instances instead of creating new ones to prevent flickering
    this.isModalOpen = true;
    let modalEl: HTMLElement | null = null;

    switch (plan) {
      case 'Pro':
        if (this.proModalInstance) {
          this.proModalInstance.show();
          modalEl = document.getElementById('stripeModalPro');
        } else {
          console.error('Pro Modal instance not initialized');
        }
        break;
      case 'ProAnnual':
        if (this.proModalInstanceAnnual) {
          this.proModalInstanceAnnual.show();
          modalEl = document.getElementById('stripeModalProAnnual');
        } else {
          console.error('Pro Annual Modal instance not initialized');
        }
        break;
      case 'Standard':
        if (this.modalInstance) {
          this.modalInstance.show();
          modalEl = document.getElementById('stripeModal');
        } else {
          console.error('Standard Modal instance not initialized');
        }
        break;
      case 'StandardAnnual':
        if (this.modalInstanceAnnual) {
          this.modalInstanceAnnual.show();
          modalEl = document.getElementById('stripeModalAnnual');
        } else {
          console.error('Standard Annual Modal instance not initialized');
        }
        break;
    }

    // Add event listener to reset flag when modal is hidden
    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', () => {
        this.isModalOpen = false;
      }, { once: true });
    }
  }

  // Send subscription request with user details
  onSubscriptionSuccess(plan: string) {
    console.log(`Subscription successful: ${plan}`);

    if (!this.currentUser) {
      console.error("No user loaded. Cannot send subscription request.");
      return;
    }

    const token = localStorage.getItem('token');
    let headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const requestBody = {
      PlanName: plan,  
      Email: this.currentUser.userId
    };
    console.log(requestBody);
    this.http.post(this.subscriptionApiUrl, requestBody, { headers }).subscribe({
      next: (response) => {
        console.log("Subscription saved successfully", response);
        this.router.navigate(['/home']); // Redirect on success
      },
      error: (error) => {
        console.error("Error saving subscription", error);
      }
    });
  }

  // Landing page navbar methods
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

  toggleMobileDropdown(section: 'features' | 'resources') {
    this.isMobileDropdownOpen[section] = !this.isMobileDropdownOpen[section];
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}
