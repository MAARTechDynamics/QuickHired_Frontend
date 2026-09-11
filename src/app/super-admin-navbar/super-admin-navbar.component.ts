import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Renderer2 } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-super-admin-navbar',
  standalone: true, 
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './super-admin-navbar.component.html',
  styleUrl: './super-admin-navbar.component.css'
})
export class SuperAdminNavbarComponent {
currentUserPlan: string | null = null;
  currentUserEmail: string | null = null;
  currentUser: any = null;
  userId: string = ''; 
  searchText: string = '';
  filteredReports: any[] = [];
  private userApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster`;
  public profileImageUrl: string = '/assets/logos/user_2.png'; // default

  constructor(private renderer: Renderer2, private http: HttpClient) {}
  ngAfterViewInit(): void {
    setTimeout(() => {
      // const toggleButton = document.getElementById('kt_aside_toggle');
      // if (toggleButton) {
      //   toggleButton.click();
      // }
      if (this.currentUserEmail) {
        this.loadUserTheme();
      }
    }, 0);
  }
    ngOnInit() {
    const refreshed = localStorage.getItem('navbar-refreshed');
    
    if (!refreshed) {
      localStorage.setItem('navbar-refreshed', 'true');
      window.location.reload(); 
      return;
    } else {
      localStorage.removeItem('navbar-refreshed'); // reset for next visit
    }

  
    setTimeout(() => {
      this.loadCurrentUser();
    }, 1000);
  }


  // ngOnInit() {
     
    
  //   setTimeout(() => {
  //     this.loadCurrentUser();
  //   }, 5000); // Delay by 1 second
    
  // }

  formatPlanName(plan: string | null | undefined): string {
    if (!plan) return '';
    return plan.replace(/(Standard|Pro)(Annual)/, '$1 $2');
  }


// loadCurrentUser(): void {
//   const token = localStorage.getItem('token');
//   if (!token) return;

//   const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
//   this.http.get<any>(this.userApiUrl, { headers }).subscribe({
//     next: (res) => {
//       this.currentUserEmail = res.model?.email || null;
//       this.userId = res.model?.userId;
//       if (this.currentUserEmail) {
//         //this.fetchReports();
//       }
//     },
//     error: () => localStorage.removeItem('token')
//   });
// }



loadCurrentUser() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  this.http.get<any>(this.userApiUrl, { headers }).subscribe({
    next: (res) => {
      this.currentUserEmail = res.model?.email || null;
      this.currentUser = res.model;
      this.userId = res.model?.userId;

      if (this.currentUserEmail) {
        this.loadUserPlan(this.userId);
        this.loadUserTheme();
      }

     
      if (this.userId) {
        this.http.get<any>(`${environment.apiBaseUrl}/api/SecurityMaster/GetUserProfileImage/${this.userId}`, { headers })
          .subscribe((imgRes) => {
            const path = imgRes?.imagePath;
            this.profileImageUrl = path
              ? `https://localhost:44303/${path}`
              : '/assets/logos/user_2.png'; // default
          });
      } else {
        this.profileImageUrl = '/assets/logos/user_2.png'; // default
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
  this.http.post<any[]>(`${environment.apiBaseUrl}/api/InterviewReports/GetUserReportsByEmail`, payload).subscribe((res) => {
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
  this.http.get<any>(`${environment.apiBaseUrl}/api/SecurityMaster/get-user-plan/${email}`).subscribe({
    next: (res) => {
      this.currentUserPlan = res.planName || null;
    },
    error: () => {
      this.currentUserPlan = null;
    }
  });
}

setTheme(theme: 'light' | 'dark' | 'system') {
  if (!this.currentUserEmail) return;

  const body = {
    email: this.currentUserEmail,
    theme: theme
  };

  this.http.post(`${environment.apiBaseUrl}/api/InterviewReports/SetTheme`, body).subscribe({
    next: () => {
      this.applyTheme(theme);
       console.log('Theme saved to server:', theme);
    },
    error: err => console.error('Failed to save theme', err)
  });
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



loadUserTheme() {
  if (!this.currentUserEmail) return;

  const url = `${environment.apiBaseUrl}/api/InterviewReports/GetTheme/${this.currentUserEmail}`;
  this.http.get(url, { responseType: 'text' }).subscribe({
    next: (theme: string) => {
      this.applyTheme(theme);
      
      // console.log('Theme loaded from server:', theme);
    },
    error: err => {
      console.error('Failed to load theme', err);
      this.applyTheme('light'); // fallback
    }
  });
}
}
