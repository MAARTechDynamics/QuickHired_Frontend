import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../environments/environment';
declare var bootstrap: any;

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnInit {

  forgotPasswordForm: FormGroup;
  isSubmitting: boolean = false;
  supportForm!: FormGroup;
  message = '';
  private apiUrlSupport = `${environment.apiBaseUrl}/api/SecurityMaster/support-submit`;
  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }
  ngOnInit(): void {
    this.supportForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }
  get f() {
    return this.forgotPasswordForm.controls;
  }
  get email() {
    return this.forgotPasswordForm.get('email');
  }
  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const email = this.forgotPasswordForm.value.email;

    // Determine API URL based on environment
    let apiUrl = '';
    if (location.hostname === 'localhost') {
      apiUrl = 'https://localhost:44303/api/SecurityMaster/forgotpassword'; 
    } else {
      apiUrl = 'http://api.quickhired.com/api/SecurityMaster/forgotpassword';  
    }
    this.http.post(apiUrl, { email: email }).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;

        // Store email in local storage
        localStorage.setItem('forgotPasswordEmail', email);

        Swal.fire({
          icon: 'success',
          title: 'Email Sent!',
          text: 'A reset password link has been sent to your email.'
        });

        // Optionally reset form
        this.forgotPasswordForm.reset();
      },
      error: (err) => {
        this.isSubmitting = false;

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Something went wrong. Please try again later.'
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
}
