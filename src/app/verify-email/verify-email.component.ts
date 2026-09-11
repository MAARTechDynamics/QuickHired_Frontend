import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient ,HttpClientModule,HttpHeaders} from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule,HttpClientModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent {
  verifyForm: FormGroup;
  email: string | null = null;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  apiUrl = `${environment.apiBaseUrl}/api/SecurityMaster/verify-email-code`;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    this.verifyForm = this.fb.group({
      code_1: ['', [Validators.required, Validators.pattern('[0-9]')]],
      code_2: ['', [Validators.required, Validators.pattern('[0-9]')]],
      code_3: ['', [Validators.required, Validators.pattern('[0-9]')]],
      code_4: ['', [Validators.required, Validators.pattern('[0-9]')]],
      code_5: ['', [Validators.required, Validators.pattern('[0-9]')]],
      code_6: ['', [Validators.required, Validators.pattern('[0-9]')]]
    });

    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '*****@example.com'; // Default masked email
    });
  }
  maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const maskedLocal = parts[0].substring(0, 2) + '*****';
    return `${maskedLocal}@${parts[1]}`;
  }
  moveToNext(event: any, nextInput: string) {
    const value = event.target.value;
    if (/^[0-9]$/.test(value)) { // Allow only numbers
      const next = document.querySelector(`[formControlName="${nextInput}"]`) as HTMLInputElement;
      if (next) {
        next.focus();
      }
    } else {
      event.target.value = ''; // Clear if not a number
    }
  }
  
 submitVerification() {
  if (this.verifyForm.invalid) {
    return;
  }

  this.isSubmitting = true;
  this.errorMessage = null;
  const code = Object.values(this.verifyForm.value).join('');

  if (!this.email) {
    this.errorMessage = 'Email is missing!';
    this.isSubmitting = false;
    return;
  }

  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  const requestBody = { code, email: this.email };

  this.http.post<boolean>(this.apiUrl, requestBody, { headers, withCredentials: true })
    .subscribe(
      (isValid) => {
        this.isSubmitting = false;

        if (isValid) {
         
          Swal.fire({
            title: 'Registration Successful 🎉',
            html: `
              <p style="font-size: 16px; color: #444;">
                Your account has been successfully verified and activated.<br>
                You can now proceed to login and continue using the application.
              </p>
            `,
            icon: 'success',
            confirmButtonText: 'Login Now',
            confirmButtonColor: '#3085d6',
            background: '#f9f9f9',
            customClass: {
              popup: 'rounded-2xl shadow-lg',
              title: 'text-xl font-semibold text-gray-800',
            }
          }).then((result) => {
            if (result.isConfirmed) {
              this.router.navigate(['/login']);
            }
          });
        } else {
          this.errorMessage = 'Invalid code. Please try again.';
        }
      },
      (error) => {
        this.isSubmitting = false;
        console.error('Error:', error);

        if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Invalid code. Please try again.';
        } else if (error.status === 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else if (error.status === 0) {
          this.errorMessage = 'Network error. Please check your connection.';
        } else {
          this.errorMessage = 'Something went wrong. Please try again.';
        }
      }
    );
}

  resendCode() {
    if (!this.email) {
      this.errorMessage = 'Email is missing!';
      return;
    }
  
    this.isSubmitting = true;
    this.errorMessage = null;
  
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const requestBody = { email: this.email };
  
    this.http.post<boolean>(`${environment.apiBaseUrl}/api/SecurityMaster/resend-email-code`, requestBody, { headers, withCredentials: true })
      .subscribe(
        (response) => {
          this.isSubmitting = false;
          if (response) {
            this.successMessage = 'New code sent in email.';
          } else {
            this.errorMessage = 'Failed to resend the code. Please try again.';
          }
        },
        (error) => {
          this.isSubmitting = false;
          console.error('Error:', error);
          this.errorMessage = 'Something went wrong. Please try again.';
        }
      );
  }
  
  
}
