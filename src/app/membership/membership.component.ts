import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment';

declare var bootstrap: any;
@Component({
  selector: 'app-membership',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './membership.component.html',
  styleUrl: './membership.component.css'
})
export class MembershipComponent implements OnInit {
  subscriptions: any[] = [];
  currentUserEmail: string | null = null;
  token = localStorage.getItem('token');
  userApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster`;
  subscriptionApiUrl = `${environment.apiBaseUrl}/api/Membership/user-subscriptions`;
  paymentForm!: FormGroup;
  stripe: Stripe | null = null;
  card!: StripeCardElement;
  cardErrors: string | null = null;
  loading = false;
  fetchedDetails: any = null;
  customerId!: string; 
  fb: any; 
  userId:string ="";
  constructor(private http: HttpClient, private router: Router,private fbm: FormBuilder,) {}

  async ngOnInit() {
      // setTimeout(() => {
      //   this.loadCurrentUser();
      // }, 2000);
       this.loadCurrentUser();
      this.paymentForm = this.fbm.group({
        email: ['', [Validators.required, Validators.email]]
        
      });
      this.stripe = await loadStripe('pk_test_51R2AHHEI7JiDsJpZrFZ2tSZZg1NXm6HVboq9OhjXUZhHtldV8jYjCgXfPC49vcZkPefpIBy81WgJtkmNPekw6ZI5002W1b7ZuV');

      
      const elements = this.stripe?.elements();
      if (elements) {
        this.card = elements.create('card');
        this.card.mount('#card-element');

        this.card.on('change', (event) => {
          this.cardErrors = event.error ? event.error.message : null;
        });
      }
  }
  async submit() {
      if (this.paymentForm.invalid || !this.stripe || !this.card) return;

      this.loading = true;

      const { paymentMethod, error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.card,
        billing_details: {
          email: this.paymentForm.value.email,
        },
      });

      if (error) {
        this.cardErrors = error.message || 'Error creating payment method';
        this.loading = false;

        Swal.fire({
          icon: 'error',
          title: 'Payment Error',
          text: this.cardErrors
        });

        return;
      }

      const updateRequest = {
        CustomerId: this.customerId,
        Email: this.paymentForm.value.email,
        NewPaymentMethodId: paymentMethod?.id,
      };

      this.http.post(`${environment.apiBaseUrl}/api/stripe/update-payment-details`, updateRequest).subscribe({
        next: () => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Payment details updated successfully.',
            confirmButtonColor: '#3085d6'
          });
        },
        error: () => {
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: 'Failed to update payment details.',
            confirmButtonColor: '#d33'
          });
        }
      });
  }
  
  loadCurrentUser(): void {
    if (!this.token) return;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);

    this.http.get<any>(this.userApiUrl, { headers }).subscribe({
      next: (res) => {
        this.currentUserEmail = res.model?.email || null;
        this.userId = res.model?.userId;
        if (this.currentUserEmail) {
          this.loadSubscriptions();
        }
      },
      error: () => localStorage.removeItem('token')
    });
  }
  formatPlanName(planName: string | undefined): string {
    if (!planName) return '';
    return planName.replace(/(Standard|Pro)(Annual)/, '$1 $2');
  }

  loadSubscriptions(): void {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
    this.http.get<any[]>(`${this.subscriptionApiUrl}?email=${this.userId}`, { headers })
      .subscribe({
        next: (data) => {
          this.subscriptions = data;
        },
        error: (err) => {
          console.error('Error loading subscriptions', err);
        }
      });
  }

  navigateToUpgrade(): void {
    this.router.navigate(['/pricing']);
  }

  viewPaymentDetails(subscription: any): void {
    this.customerId = subscription.customerId;
    //this.router.navigate(['/payment'], { queryParams: { customerId } });
    this.fetchPaymentDetails();
    setTimeout(() => {
      const modalElement = document.getElementById('paymentModal');
      if (modalElement) {
        const bsModal = new bootstrap.Modal(modalElement);
        bsModal.show();
      }
    }, 100);
  }

  fetchPaymentDetails() {
    if (!this.customerId) return;

    this.http.get<any>(`${environment.apiBaseUrl}/api/stripe/get-payment-details/${this.customerId}`).subscribe({
      next: (data) => {
        this.fetchedDetails = data;
        this.paymentForm.patchValue({ email: data.email });
      },
      error: () => {
        this.fetchedDetails = null;
      }
    });
  }
    cancelMembership(subscription: any): void {
    Swal.fire({
      title: 'Cancel Membership',
      input: 'text',
      inputLabel: 'Reason for cancellation',
      inputPlaceholder: 'Type your reason here...',
      showCancelButton: true,
      confirmButtonText: 'Confirm Cancellation',
      icon: 'question'
    }).then((result) => {
      if (result.isConfirmed && result.value?.trim()) {
        const reason = result.value;
        const payload = {
          email: this.userId,
          subscriptionId: subscription.subscriptionId || null,
          cancellationReason: reason
        };

        const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
        const endpoint = subscription.subscriptionId
          ? `${environment.apiBaseUrl}/api/Membership/cancel-subscription`
          : `${environment.apiBaseUrl}/api/Membership/cancel-subscription-local`;

        this.http.post(endpoint, payload, { headers }).subscribe({
          next: (res: any) => {
            Swal.fire({
              title: 'Subscription Cancelled',
              text: res.message,
              icon: 'success',
              confirmButtonText: 'OK',
              allowOutsideClick: false,       
              allowEscapeKey: false,          
              backdrop: true                
            }).then((result) => {
              if (result.isConfirmed) {
                this.router.navigate(['/login']); 
              }
            });
          },

          error: () => {
            Swal.fire({
              title: 'Error',
              text: 'Could not cancel subscription.',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
      }
    });
  }

}

