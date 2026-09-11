import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment';
declare var bootstrap: any;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  resetForm!: FormGroup;
  complexPassword = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+}{\\\":;'?/<>.,])[A-Za-z\\d!@#$%^&*()_+}{\\\":;'?/<>.,]{8,16}$";
  token!: string;
  email!: string;
  apiUrl: string = '';
  isSubmitting: boolean = false;
  supportForm!: FormGroup;
  message = '';
  private apiUrlSupport = `${environment.apiBaseUrl}/api/SecurityMaster/support-submit`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    
    if (location.hostname === 'localhost') {
      this.apiUrl = 'https://localhost:44303/api/SecurityMaster/resetpassword';
    } else {
      this.apiUrl = 'http://api.quickhired.com/api/SecurityMaster/resetpassword';
    }

    // get token & email from query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.email = params['email'];
    });

    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.pattern(this.complexPassword)]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
     this.supportForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  get passwordErrors() {
    const password = this.resetForm.get('password')?.value || '';
    return {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+}{":;'?/<>.,]/.test(password),
    };
  }

 onSubmit() {
  if (this.resetForm.invalid) {
    this.resetForm.markAllAsTouched();
    return;
  }

  this.isSubmitting = true;  // Start loader

  const body = {
    email: this.email,
    token: this.token,
    newPassword: this.resetForm.get('password')?.value
  };

  this.http.post<any>(this.apiUrl, body).subscribe({
    next: () => {
      this.isSubmitting = false; // Stop loader
      Swal.fire({
        title: 'Password Reset Successful!',
        icon: 'success',
        confirmButtonText: 'Sign In'
      }).then(() => {
        this.router.navigate(['/login']);
      });
    },
    error: (err) => {
      this.isSubmitting = false; // Stop loader
      Swal.fire('Error', err.error?.message || 'Something went wrong!', 'error');
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
