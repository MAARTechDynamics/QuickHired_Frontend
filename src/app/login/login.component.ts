import { ChangeDetectorRef, Component, OnInit, Renderer2,AfterViewInit  } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import { SeoService } from '../services/seo.service';
import { AnalyticsService } from '../services/analytics.service';
import { SEO_CONFIG } from '../config/seo.config';
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
  selector: 'app-login',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  private apiUrl = `${environment.apiBaseUrl}/api/SecurityMaster/login`; 
  loading = false;
  supportForm!: FormGroup;
  message = '';
  isSubmitting = false;
  fbLoaded = false;
  private apiUrlSupport = `${environment.apiBaseUrl}/api/SecurityMaster/support-submit`;
  
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private renderer: Renderer2,
    private seoService: SeoService,
    private analyticsService: AnalyticsService,
    private cdRef: ChangeDetectorRef,
    private i18nService: I18nService 
    ) {
      this.loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required]
      });
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

  // ngAfterViewInit(): void {
  //   const savedLang = localStorage.getItem('selectedLang');
  //   if (savedLang) {
  //     const lang = this.languages.find(l => l.code === savedLang);
  //     if (lang) {
  //       this.setLanguage(lang);
  //       this.translatePage(lang.code);
  //     }
  //   }
  // }

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
    console.log(response.credential);
  };

  google.accounts.id.initialize({
    client_id: '716947882975-bl7kvtjbh207qkru0ffus5fmn1lun4nm.apps.googleusercontent.com',
    callback: window.handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById('googleSignInBtn'),
    { theme: 'outline', size: 'large' }
  );

  }

//   loginWithFacebook() {
//   if (!this.fbLoaded) {
//     console.error("Facebook SDK not initialized yet.");
//     return;
//   }

//   FB.login((response: any) => {
//     if (response.authResponse) {
//       const accessToken = response.authResponse.accessToken;
//       this.sendFacebookTokenToBackend(accessToken);
//     } else {
//       console.log('User cancelled login or did not fully authorize.');
//     }
//   }, { scope: 'public_profile,email' });
// }
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
    this.loading = false;
    localStorage.setItem('token', res.token);
    localStorage.setItem('role', res.role || '');
    this.router.navigate(res.role === 'Super Admin' ? ['/subscriptions'] : ['/multi-step-interview']);
  }

  private handleError(err: any) {
    this.loading = false;
    this.errorMessage = err.error?.message || 'Login failed. Please try again.';
  }

  ngOnInit(): void {
    this.applyTheme('light');
    
    const seoConfig = SEO_CONFIG['login'];
    this.seoService.setPageMeta(seoConfig);
    this.seoService.addWebPageSchema(seoConfig.title, seoConfig.description, 'https://quickhired.com/login');
    this.seoService.addBreadcrumbSchema([
      { name: 'Home', url: 'https://quickhired.com' },
      { name: 'Login', url: 'https://quickhired.com/login' }
    ]);
    
     this.supportForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
    const savedLang = localStorage.getItem('selectedLang');
    if (savedLang) {
      const lang = this.languages.find(l => l.code === savedLang);
      if (lang) {
        this.setLanguage(lang); 
      }
    }
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

  // Also update this if KTThemeMode reads from it:
  localStorage.setItem('kt_theme_mode', theme);
  }
  // onSubmit() {
  //   if (this.loginForm.valid) {
  //     this.loading = true;
  //     this.http.post<any>(this.apiUrl, this.loginForm.value).subscribe({
  //       next: (response) => {
  //         console.log("Login Response:", response); // Debugging
  
  //         if (response.isError) {
  //           this.errorMessage = response.message || "Invalid email or password.";
  //         } else {
  //           // Successful login
  //           localStorage.setItem('token', response.token);
  //           localStorage.setItem('role', response.role);
  //           // this.router.navigate(['/multi-step-interview']);
  //           // Redirect based on role
  //           if (response.role === 'Super Admin') {
  //             this.router.navigate(['/subscriptions']);
  //           } else {
  //             this.router.navigate(['/multi-step-interview']);
  //           }
  //         }
  //       },
  //       error: (error) => {
  //         console.log("HTTP Error:", error); // Debugging
  
  //         if (error.status === 401) {
  //           const errorMessage = error.error?.message || "Unauthorized access.";
  
  //           if (errorMessage.includes("Email not verified")) {
  //             // Redirect to email verification page
  //             this.router.navigate(['/verify-email'], { queryParams: { email: this.loginForm.value.email } });
  //           } else {
  //             this.errorMessage = errorMessage;
  //           }
  //         } else if (error.status === 500) {
  //           this.errorMessage = "Internal Server Error. Please try again later.";
  //         } else {
  //           this.errorMessage = "Something went wrong. Please try again.";
  //         }
  //       }
  //     });
  //   }
  // }
  
  onSubmit() {
  if (this.loginForm.valid) {
    this.loading = true; 
     this.cdRef.detectChanges();
      console.log(this.apiUrl);
    this.http.post<any>(this.apiUrl, this.loginForm.value).subscribe({
      next: (response) => {


debugger
        console.log("Login Response:", response); // Debugging

        this.loading = false; 
         this.cdRef.detectChanges();

        if (response.isError) {
          this.errorMessage = response.message || "Invalid email or password.";
        } else {
         
          localStorage.setItem('token', response.token);
          localStorage.setItem('role', response.role);

          if (response.role === 'Super Admin') {
            this.router.navigate(['/subscriptions']);
          } else {
            this.router.navigate(['/multi-step-interview']);
          }
        }
      },
      error: (error) => {
        console.log("HTTP Error:", error); // Debugging

        this.loading = false; 

        if (error.status === 401) {
          const errorMessage = error.error?.message || "Unauthorized access.";

          if (errorMessage.includes("Email not verified")) {
            this.router.navigate(['/verify-email'], {
              queryParams: { email: this.loginForm.value.email }
            });
          } else {
            this.errorMessage = errorMessage;
          }
        } else if (error.status === 500) {
          this.errorMessage = "Internal Server Error. Please try again later.";
        } else {
          this.errorMessage = "Something went wrong. Please try again.";
        }
      }
    });
  }
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
