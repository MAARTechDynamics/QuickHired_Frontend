//nav-bar.component.ts



import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component, AfterViewInit, Renderer2, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
// import { environment } from '../../../environments/environment';
declare var KTSearch: any;
declare var bootstrap: any;
declare var KTDrawer: any;
declare var KTComponents: any;
// import Swal from 'sweetalert2';

@Component({
  selector: 'app-nav-bar',
  standalone: true, 
  imports: [RouterModule, FormsModule, CommonModule,ReactiveFormsModule, HttpClientModule],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css'] 
})
export class NavBarComponent implements AfterViewInit  { 

  currentUserPlan: string | null = null;
  currentUserEmail: string | null = null;
  currentUser: any = null;
  userId: string = ''; 
  searchText: string = '';
  filteredReports: any[] = [];
  public profileImageUrl: string = '/assets/logos/user_2.png';
  supportForm!: FormGroup;
  message = '';
  isSubmitting = false;
  selectedTheme: string = 'light';
  isLoading: boolean = false;
  isDropdownOpen: boolean = false;
  userDropdownOpen = false;
  langDropdownOpen = false;
  menuOpen = false;
  themeDropdownOpen = false;
  currentLangCode = 'en';
  currentLangName = 'ENGLISH';
  currentFlag = 'assets/media/flags/united-states.svg';
  // private apiUrlSupport = `${environment.apiBaseUrl}/api/SecurityMaster/support-submit`;

  constructor(private renderer: Renderer2, private http: HttpClient,private fb: FormBuilder,private router: Router
   ) {
    
   }

  private getApiBaseUrl(): string {
    const hostname = window.location.hostname;
    if (hostname === 'localhost') {
      return 'https://localhost:44303';
    } else {
      return 'https://api.quickhired.com';
    }
  }
  
  @ViewChild('ktAsideMobile') offcanvasRef!: ElementRef;
  @ViewChild('dropdownContainer') dropdownRef!: ElementRef;
  @ViewChild('dropdownThemeContainer') dropdownRefB!: ElementRef;
  @ViewChild('userDropdownContainer') dropdownRefC!: ElementRef;



  ngAfterViewInit(): void {
    const offcanvasEl = this.offcanvasRef.nativeElement;
    const togglerBtn = document.querySelector('[data-bs-toggle="offcanvas"]') as HTMLElement;

    const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);

    
    offcanvasEl.addEventListener('shown.bs.offcanvas', () => {
      togglerBtn?.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    
    offcanvasEl.addEventListener('hidden.bs.offcanvas', () => {
      togglerBtn?.classList.remove('active');

      
      const backdrop = document.querySelector('.offcanvas-backdrop');
      if (backdrop) backdrop.remove();

      document.body.classList.remove('offcanvas-backdrop');
      document.body.style.overflow = '';
    });

  
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => {
          const instance = bootstrap.Offcanvas.getInstance(offcanvasEl);
          if (instance) {
            instance.hide(); 
          } else {
            // Manual fallback if no instance found
            offcanvasEl.classList.remove('show');
            offcanvasEl.style.visibility = 'hidden';
            offcanvasEl.style.transform = 'translateX(-100%)';

            //  Remove leftover backdrop and unlock scroll
            const backdrop = document.querySelector('.offcanvas-backdrop');
            if (backdrop) backdrop.remove();

            document.body.classList.remove('offcanvas-backdrop');
            document.body.style.overflow = ''; //  Restore scroll
          }
        }, 100);
      }
    });

    document.addEventListener('click', this.handleClickOutside.bind(this));
    document.addEventListener('click', this.handleClickOutsideB.bind(this));
    document.addEventListener('click', this.handleClickOutsideC.bind(this));

    setTimeout(() => {
      if (this.currentUserEmail) {
        this.loadUserTheme();
      }
    }, 0);
  }
  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
 

  toggleUserDropdown(): void {
  this.userDropdownOpen = !this.userDropdownOpen;
  this.langDropdownOpen = false; 
  }

  toggleLangDropdown(): void {
    this.langDropdownOpen = !this.langDropdownOpen;
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }
   closeDropdownB() {
    this.themeDropdownOpen = false;
  }
   closeDropdownC() {
    this.userDropdownOpen = false;
  }
  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
    document.removeEventListener('click', this.handleClickOutsideB.bind(this));
    document.removeEventListener('click', this.handleClickOutsideC.bind(this));
  }
  
  ngOnInit() {
    const refreshed = localStorage.getItem('navbar-refreshed');
    
    if (!refreshed) {
      localStorage.setItem('navbar-refreshed', 'true');
      window.location.reload(); 
      return;
    } else {
      localStorage.removeItem('navbar-refreshed');
    }
     this.supportForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        subject: ['', Validators.required],
        message: ['', Validators.required]
      });
    setTimeout(() => {
      this.loadCurrentUser();
    }, 1000);
    const savedLang = localStorage.getItem('selectedLang');
    if (savedLang) {
      const lang = this.languages.find(l => l.code === savedLang);
      if (lang) {
        this.setLanguage(lang); 
      }
  }
  }
  handleClickOutside(event: MouseEvent): void {
    if (
      this.isDropdownOpen &&
      this.dropdownRef &&
      !this.dropdownRef.nativeElement.contains(event.target)
    ) {
      this.closeDropdown();
    }
  }
  handleClickOutsideB(event: MouseEvent): void {
    if (
      this.themeDropdownOpen &&
      this.dropdownRefB &&
      !this.dropdownRefB.nativeElement.contains(event.target)
    ) {
      this.closeDropdownB();
    }
  }
  handleClickOutsideC(event: MouseEvent): void {
    if (
      this.userDropdownOpen &&
      this.dropdownRefC &&
      !this.dropdownRefC.nativeElement.contains(event.target)
    ) {
      this.closeDropdownC();
    }
  }
  toggleLanguageMenu() {
  this.menuOpen = !this.menuOpen;
  }
  

  languages = [
    { code: 'en', name: 'english', display: 'English', flag: 'assets/media/flags/united-states.svg' },
    { code: 'de', name: 'german', display: 'German', flag: 'assets/media/flags/germany.svg' },
    { code: 'fr', name: 'french', display: 'French', flag: 'assets/media/flags/france.svg' },
    { code: 'ja', name: 'japanese', display: 'Japanese', flag: 'assets/media/flags/japan.svg' },
    { code: 'ar', name: 'arabic', display: 'العربية', flag: 'assets/media/flags/saudi-arabia.svg' },
    { code: 'zh', name: 'chinese', display: '中文', flag: 'assets/media/flags/china.svg' },
    { code: 'pt', name: 'portuguese', display: 'Português', flag: 'assets/media/flags/portugal.svg' },
    { code: 'nl', name: 'dutch', display: 'Nederlands', flag: 'assets/media/flags/netherlands.svg' },
    { code: 'el', name: 'greek', display: 'Ελληνικά', flag: 'assets/media/flags/greece.svg' },
    { code: 'pl', name: 'polish', display: 'Polski', flag: 'assets/media/flags/poland.svg' },
    { code: 'sv', name: 'swedish', display: 'Svenska', flag: 'assets/media/flags/sweden.svg' },
    { code: 'da', name: 'danish', display: 'Dansk', flag: 'assets/media/flags/denmark.svg' },
    { code: 'fi', name: 'finnish', display: 'Suomi', flag: 'assets/media/flags/finland.svg' },
    { code: 'hu', name: 'hungarian', display: 'Magyar', flag: 'assets/media/flags/hungary.svg' },
    { code: 'cs', name: 'czech', display: 'Čeština', flag: 'assets/media/flags/czech-republic.svg' },
  ];
  switchLanguage(lang: any) {
    this.setLanguage(lang);
    
    localStorage.setItem('selectedLang', lang.code);
    this.translatePage(lang.code);
    this.menuOpen = false;
  }

  setLanguage(lang: any) {
    this.currentLangCode = lang.code;
    this.currentLangName = lang.display;
    this.currentFlag = lang.flag;
  }
  async translatePage(language: string) {
    const apiKey = 'AIzaSyB6G19-LqosL42AOdxLW-cg-FUwh31Cims'; 
    const allElements = document.body.getElementsByTagName("*");

    for (const elem of Array.from(allElements)) {
      if (elem.children.length === 0 && elem.textContent?.trim()) {
        const original = elem.textContent.trim();

        try {
          const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}&q=${encodeURIComponent(original)}&target=${language}`);
          const data = await res.json();

          if (data?.data?.translations?.[0]?.translatedText) {
            elem.textContent = data.data.translations[0].translatedText;
          }
        } catch (error) {
          console.error('Translate Error:', error);
        }
      }
    }
  }


  formatPlanName(plan: string | null | undefined): string {
    if (!plan) return '';
    return plan.replace(/(Standard|Pro)(Annual)/, '$1 $2');
  }

  loadCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const apiBase = this.getApiBaseUrl();

    this.http.get<any>(`${apiBase}/api/SecurityMaster`, { headers }).subscribe({
      next: (res) => {
        this.currentUserEmail = res.model?.email || null;
        this.currentUser = res.model;
        this.userId = res.model?.userId;

        if (this.currentUserEmail) {
          this.loadUserPlan(this.userId);
          this.loadUserTheme();
        }

        if (this.userId) {
          this.http.get<any>(`${apiBase}/api/SecurityMaster/GetUserProfileImage/${this.userId}`, { headers })
            .subscribe((imgRes) => {
              const path = imgRes?.imagePath;
              this.profileImageUrl = path
                ? `${apiBase}/${path}`
                : '/assets/logos/user_2.png';
            });
        } else {
          this.profileImageUrl = '/assets/logos/user_2.png';
        }
      },
      error: () => localStorage.removeItem('token')
    });
  }

  searchReports(query: string) {
    this.searchText = query;
    if (query.length < 2) {
      this.filteredReports = [];
      return;
    }

    const payload = { email: this.userId };
    const apiBase = this.getApiBaseUrl();

    this.http.post<any[]>(`${apiBase}/api/InterviewReports/GetUserReportsByEmail`, payload).subscribe((res) => {
      this.filteredReports = res.filter((report) => {
        const companyName = report.persona?.companyName?.toLowerCase() || '';
        const jobTitle = report.persona?.jobTitle?.toLowerCase() || '';
        const interviewType = report.interviewType?.toLowerCase() || '';
        const search = query.toLowerCase();
      
        return (
          companyName.includes(search) ||
          jobTitle.includes(search) ||
          interviewType.includes(search)
        );
      });
      console.log(this.filteredReports);
    });
  }

  loadUserPlan(email: string) {
    const apiBase = this.getApiBaseUrl();
    this.http.get<any>(`${apiBase}/api/SecurityMaster/get-user-plan/${email}`).subscribe({
      next: (res) => {
        this.currentUserPlan = res.planName || null;
      },
      error: () => {
        this.currentUserPlan = null;
      }
    });
  }

  setTheme(theme: 'light' | 'dark' | 'system') {
    console.log(theme);
    if (!this.currentUserEmail) return;

    const body = {
      email: this.currentUserEmail,
      theme: theme
    };

    const apiBase = this.getApiBaseUrl();

    this.http.post(`${apiBase}/api/InterviewReports/SetTheme`, body).subscribe({
      next: () => {
        this.applyTheme(theme);
         this.selectedTheme = theme;
         console.log('Theme saved to server:', theme);
      },
      error: err => console.error('Failed to save theme', err)
    });
  }
  toggleThemeDropdown() {
    this.themeDropdownOpen = !this.themeDropdownOpen;
  }
  applyTheme(theme: string) {
    if (typeof window !== 'undefined' && (window as any).KTThemeMode) {
      (window as any).KTThemeMode.setMode(theme);
    }

    const html = document.documentElement;
    this.themeDropdownOpen = false;

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

  loadUserTheme() {
    if (!this.currentUserEmail) return;

    const apiBase = this.getApiBaseUrl();
    const url = `${apiBase}/api/InterviewReports/GetTheme/${this.currentUserEmail}`;
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (theme: string) => {
        this.applyTheme(theme);
      },
      error: err => {
        console.error('Failed to load theme', err);
        this.applyTheme('light');
      }
    });
  }
  submitSupportForm(): void {
          if (this.supportForm.invalid) {
            this.supportForm.markAllAsTouched();
            return;
          }
      
          this.isSubmitting = true;
      
          // this.http.post<any>(this.apiUrlSupport, this.supportForm.value).subscribe({
          //   next: (res) => {
          //     this.message = res.message;
          //     this.isSubmitting = false;
          //     this.supportForm.reset();
      
          //     Swal.fire({
          //       icon: 'success',
          //       title: 'Success!',
          //       text: 'Your support request has been submitted.',
          //       confirmButtonColor: '#3085d6'
          //     });
      
            
          //     const modalElement = document.getElementById('kt_modal_new_ticket');
          //     const modal = bootstrap.Modal.getInstance(modalElement!);
          //     modal?.hide();
          //   },
          //   error: (err) => {
          //     this.message = err.error?.message || "Something went wrong.";
          //     this.isSubmitting = false;
      
          //     Swal.fire({
          //       icon: 'error',
          //       title: 'Oops...',
          //       text: 'Failed to submit support request!',
          //       confirmButtonColor: '#d33'
          //     });
          //   }
          // });
  }
}