import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AsyncValidatorFn, AbstractControl } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, take, switchMap, of, map, catchError, finalize } from 'rxjs';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-super-admin-register',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './super-admin-register.component.html',
  styleUrl: './super-admin-register.component.css'
})
export class SuperAdminRegisterComponent implements OnInit{
  
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  registerForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  complexPassword = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+}{\":;'?/<>.,])[A-Za-z\\d!@#$%^&*()_+}{\":;'?/<>.,]{8,16}$";

  constructor() {}

  ngOnInit() { 
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email], [this.validateEmailNotTaken()]],
      password: ['', [Validators.required, Validators.pattern(this.complexPassword)]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }
  get passwordErrors() {
    const password = this.registerForm.get('password')?.value || '';
    return {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+}{":;'?/<>.,]/.test(password),
    };
  }
  
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  validateEmailNotTaken(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      return control.valueChanges.pipe(
        debounceTime(1500),
        distinctUntilChanged(),
        take(1), 
        switchMap(value => {
          if (!value) return of(null); 
  
          return this.http.get<boolean>(`${environment.apiBaseUrl}/api/SecurityMaster/emailexists?email=${value}`).pipe(
            map(isTaken => {
              console.log("API Response:", isTaken); // Debugging
              return isTaken ? { emailExists: true } : null; 
            }),
            catchError(error => {
              console.error("API Error:", error);
              return of(null);
            }),
            finalize(() => control.markAsTouched()),
          );
        })
      );
    };
  }
  // Form Submission
  submitForm() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValues = this.registerForm.value;

    const requestPayload = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      jobTitle: "Software Engineer",
      experienceLevel: "Intermediate",
      yearsOfExperience: 3,
      skills: "Angular, TypeScript, .NET",
      education: "Bachelor's in Computer Science",
      linkedInProfile: "https://linkedin.com/in/example",
      resumeUrl: "https://example.com/resume.pdf",
      address: "123 Main St",
      city: "New York",
      state: "NY",
      country: "USA",
      zipCode: "10001",
      password: formValues.password
    };

    // Send the request
    this.http.post(`${environment.apiBaseUrl}/api/SecurityMaster/super-admin-register`, requestPayload)
    .subscribe({
      next: () => {
        // Redirect with email in query params
        this.router.navigate(['/verify-email'], { queryParams: { email: formValues.email } });
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        this.isSubmitting = false;
      }
    });

  }
}

