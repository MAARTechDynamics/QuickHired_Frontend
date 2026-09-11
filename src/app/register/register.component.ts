import { Component, inject,OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';  
import { debounceTime, finalize, map, switchMap, take, catchError, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import { I18nService } from '../services/i18n.service';
import { TranslatePipe } from '../pipes/translate.pipe';
import Swal from 'sweetalert2';
declare var bootstrap: any;
declare const google: any;
declare const FB: any;
declare global {
  interface Window {
    handleCredentialResponse: (response: any) => void;
    fbAsyncInit: () => void;
  }
}

@Component({
  selector: 'app-regsiter',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule,TranslatePipe ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit{
  
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  fbLoaded = false;
  registerForm!: FormGroup;
  supportForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  message = '';
  private apiUrl = `${environment.apiBaseUrl}/api/SecurityMaster/support-submit`;
  complexPassword = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+}{\":;'?/<>.,])[A-Za-z\\d!@#$%^&*()_+}{\":;'?/<>.,]{8,16}$";

  constructor(private i18nService: I18nService) {}
  ngAfterViewInit() {
    const interval = setInterval(() => {
    if (typeof FB !== 'undefined' && FB.getLoginStatus) {
      this.fbLoaded = true;
      console.log(" FB SDK Ready to use");
      clearInterval(interval);
    }
   }, 500);
    window.handleCredentialResponse = (response: any) => {
      this.handleGoogleResponse(response.credential);
    };
  
    google.accounts.id.initialize({
      client_id: '985167242683-v3r7sablc05onr4mnnbklgb9abfun4h9.apps.googleusercontent.com',
      callback: window.handleCredentialResponse
    });
  
    google.accounts.id.renderButton(
      document.getElementById('googleSignInBtnB'),
      { theme: 'outline', size: 'large' }
    );
    const fbScriptTag = document.createElement('script'); 
    fbScriptTag.src = 'https://connect.facebook.net/en_US/sdk.js';
    fbScriptTag.async = true;
    fbScriptTag.defer = true;
    fbScriptTag.onload = () => {
      window.fbAsyncInit = function () {
        FB.init({
          appId: '2919394641754981',
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
      };
    };
    document.body.appendChild(fbScriptTag);
    }
  
    loginWithFacebook() {
      if (!this.fbLoaded) {
        Swal.fire({
          icon: 'warning',
          title: 'Facebook Login',
          text: 'Facebook SDK is still loading. Please try again in a moment.',
          confirmButtonColor: '#3085d6'
        });
        return;
      }
    
      FB.login(async (response: any) => {
        if (response.authResponse && response.authResponse.accessToken) {
          try {
            //  Verify if token is valid and user granted permission
            FB.api('/me', { fields: 'id,name,email' }, (userInfo: any) => {
              if (userInfo && userInfo.id) {
                console.log(" Valid Facebook user:", userInfo);
    
                // Send to backend only if valid
                this.sendFacebookTokenToBackend(response.authResponse.accessToken);
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Login Cancelled',
                  text: 'We couldn’t verify your Facebook account. Please try again.',
                  confirmButtonColor: '#d33'
                });
              }
            });
          } catch (err) {
            console.error("Error verifying Facebook login:", err);
            Swal.fire({
              icon: 'error',
              title: 'Login Failed',
              text: 'Something went wrong verifying your Facebook login. Please try again.',
              confirmButtonColor: '#d33'
            });
          }
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Login Cancelled',
            text: 'You cancelled the Facebook login or didn’t authorize the app.',
            confirmButtonColor: '#3085d6'
          });
        }
      }, { scope: 'public_profile,email' });
    }
  
    sendFacebookTokenToBackend(token: string) {
      this.http.post<any>(`${environment.apiBaseUrl}/api/SecurityMaster/facebook-login`, { accessToken: token })
        .subscribe({
          next: res => this.handleLoginSuccess(res),
          error: err => this.handleError(err)
        });
    }
  
    private handleGoogleResponse(token: string) {
      this.http.post<any>(`${environment.apiBaseUrl}/api/SecurityMaster/google-login`, { credential: token })
        .subscribe({
          next: res => this.handleLoginSuccess(res),
          error: err => this.handleError(err)
        });
    }
  
    private handleLoginSuccess(res: any) {
      this.isSubmitting = false;
      localStorage.setItem('token', res.token);
      localStorage.setItem('role', res.role || '');
      this.router.navigate(res.role === 'Super Admin' ? ['/subscriptions'] : ['/multi-step-interview']);
    }
  
    private handleError(err: any) {
      this.isSubmitting = false;
      this.errorMessage = err.error?.message || 'Login failed. Please try again.';
    }
    ngOnInit() { 
      this.registerForm = this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email], [this.validateEmailNotTaken()]],
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
      
      // Initialize I18nService and then set language
      setTimeout(() => {
        const savedLang = localStorage.getItem('selectedLang') || 'en';
        const langObj = this.languages.find(lang => lang.code === savedLang);
        if (langObj) {
          this.setLanguage(langObj);
        }
        // Force I18nService to load English if needed
        this.i18nService.setLanguage(savedLang).catch(() => {
          console.log('Translation loading fallback');
        });
      }, 0);
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

    // Get password strength level (0-5)
    getPasswordStrength(): number {
      const password = this.registerForm.get('password')?.value || '';
      if (!password) return 0;

      let strength = 0;
      if (password.length >= 8) strength++;
      if (password.length >= 12) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[!@#$%^&*()_+}{":;'?/<>.,]/.test(password)) strength++;

      return Math.min(strength, 5);
    }

    // Get password strength class for styling
    getPasswordStrengthClass(): string {
      const strength = this.getPasswordStrength();
      if (strength <= 1) return 'strength-weak';
      if (strength <= 2) return 'strength-fair';
      if (strength <= 3) return 'strength-good';
      if (strength <= 4) return 'strength-strong';
      return 'strength-excellent';
    }

    // Get password strength text
    getPasswordStrengthText(): string {
      const strength = this.getPasswordStrength();
      if (strength <= 1) return 'Weak';
      if (strength <= 2) return 'Fair';
      if (strength <= 3) return 'Good';
      if (strength <= 4) return 'Strong';
      return 'Excellent';
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
  menuOpen = false;
  currentLangCode = 'en';
  currentLangName = 'ENGLISH';
  currentFlag = 'assets/media/flags/united-states.svg';

  // Only include supported languages (matching our translation files)
  languages = [
    { code: 'en', name: 'english', display: 'English', flag: 'assets/media/flags/united-states.svg' },
    { code: 'es', name: 'spanish', display: 'Español', flag: 'assets/media/flags/spain.svg' },
    { code: 'fr', name: 'french', display: 'Français', flag: 'assets/media/flags/france.svg' },
    { code: 'de', name: 'german', display: 'Deutsch', flag: 'assets/media/flags/germany.svg' },
    { code: 'pt', name: 'portuguese', display: 'Português', flag: 'assets/media/flags/portugal.svg' },
    { code: 'zh', name: 'chinese', display: '中文', flag: 'assets/media/flags/china.svg' }
  ];

   toggleLanguageMenu() {
    this.menuOpen = !this.menuOpen;
  }

  switchLanguage(lang: any) {
    console.log('Changing language to:', lang.display);
    
    // Show changing notification
    Swal.fire({
      icon: 'info',
      title: this.i18nService.translate('language.changing'),
      text: this.i18nService.translate('language.applying'),
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.setLanguage(lang);
    localStorage.setItem('selectedLang', lang.code);
    
    // Use I18nService to change language
    this.i18nService.setLanguage(lang.code).then(() => {
      console.log('Language change completed');
      
      // Force change detection to update all components
      setTimeout(() => {
        // Show success notification
        Swal.fire({
          icon: 'success',
          title: this.i18nService.translate('language.changed'),
          text: `${this.i18nService.translate('language.preferences.saved')} - ${lang.display}`,
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }, 500);
      
    }).catch(error => {
      console.error('Translation failed:', error);
      
      // Show error notification
      Swal.fire({
        icon: 'error',
        title: this.i18nService.translate('language.change.failed'),
        text: this.i18nService.translate('error.server'),
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    });
    
    this.menuOpen = false;
  }

  setLanguage(lang: any) {
    this.currentLangCode = lang.code;
    this.currentLangName = lang.display;
    this.currentFlag = lang.flag;
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
    this.http.post(`${environment.apiBaseUrl}/api/SecurityMaster/register`, requestPayload)
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
  submitSupportForm(): void {
    if (this.supportForm.invalid) {
      this.supportForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.http.post<any>(this.apiUrl, this.supportForm.value).subscribe({
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
