import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule,FormBuilder, FormGroup, Validators} from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment';
declare var bootstrap: any;

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [HttpClientModule, RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})

export class PaymentComponent implements OnInit {
  paymentForm!: FormGroup;
  stripe: Stripe | null = null;
  card!: StripeCardElement;
  cardErrors: string | null = null;
  loading = false;
  fetchedDetails: any = null;
  customerId!: string; 

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}
  ngAfterViewInit(): void {
      // Wait a little for DOM to load
      setTimeout(() => {
        const modalElement = document.getElementById('paymentModal');
        if (modalElement) {
          const bsModal = new bootstrap.Modal(modalElement);
          bsModal.show();
        }
      }, 300); 
    }
  async ngOnInit() {
    // Get customerId from query param
    this.route.queryParams.subscribe(params => {
      this.customerId = params['customerId'];
      if (this.customerId) {
        this.fetchPaymentDetails(); // auto-fetch
      }
    });

    this.stripe = await loadStripe('pk_test_51R2AHHEI7JiDsJpZrFZ2tSZZg1NXm6HVboq9OhjXUZhHtldV8jYjCgXfPC49vcZkPefpIBy81WgJtkmNPekw6ZI5002W1b7ZuV');

    this.paymentForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    const elements = this.stripe?.elements();
    if (elements) {
      this.card = elements.create('card');
      this.card.mount('#card-element');

      this.card.on('change', (event) => {
        this.cardErrors = event.error ? event.error.message : null;
      });
    }
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
}

