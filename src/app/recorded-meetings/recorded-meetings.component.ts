import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
declare var bootstrap: any;
import { environment } from '../environments/environment';

@Component({
  selector: 'app-recorded-meetings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './recorded-meetings.component.html',
  styleUrl: './recorded-meetings.component.css'
})
export class RecordedMeetingsComponent implements OnInit {
  currentUserEmail: string | null = null;
  meetings: any[] = [];  // Store all fetched meetings
  paginatedReports: any[] = [];  // Reports for the current page
  totalPages: number = 1;
  currentPage: number = 1;
  pageSize: number = 10;
  searchTerm: string = '';     
  filteredMeetings: any[] = [];
  userId:string = "";
  planSessionLimit = 0;
  userReportCount = 0;
  isLimitReached: boolean = false;
  private userApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster`;
  private meetingsApiUrl = `${environment.apiBaseUrl}/api/MeetingRecord/get-records`;  

  constructor(private http: HttpClient,private route:ActivatedRoute, private router:Router) {}

  // In ngAfterViewInit (component)
  // ngAfterViewInit() {
  //   const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  //   tooltipTriggerList.forEach(tooltipTriggerEl => {
  //     new bootstrap.Tooltip(tooltipTriggerEl);
  //   });
  // }


  ngOnInit(): void {
    this.loadCurrentUser();
     setTimeout(() => this.loadUserSubscriptionDetails(), 500);
  }
  // applyFilter(): void {
  //   const term = this.searchTerm.toLowerCase().trim();
  //   this.filteredMeetings = this.meetings.filter(meeting =>
  //     meeting.companyName.toLowerCase().includes(term)
  //   );
  
  //   this.totalPages = Math.ceil(this.filteredMeetings.length / this.pageSize);
  //   this.currentPage = 1;
  //   this.paginateReports();
  // }
applyFilter(): void {
  const term = this.searchTerm.toLowerCase().trim();

  this.filteredMeetings = this.meetings.filter(meeting => {
    const matchesName = meeting.companyName.toLowerCase().includes(term);

    if (this.selectedDate) {
      // Convert both dates to YYYY-MM-DD manually in local time (not UTC)
      const meetingDate = new Date(meeting.createdAt);
      const meetingDateLocal = new Date(
        meetingDate.getTime() - meetingDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .split('T')[0]; // local date string like '2025-10-10'

      const selectedDateLocal = new Date(this.selectedDate)
        .toISOString()
        .split('T')[0]; // selected date in 'YYYY-MM-DD'

      const isSameDate = meetingDateLocal === selectedDateLocal;
      return matchesName && isSameDate;
    }

    return matchesName;
  });

  this.totalPages = Math.ceil(this.filteredMeetings.length / this.pageSize);
  this.currentPage = 1;
  this.paginateReports();
}




  
selectedDate: string | null = null;

clearDateFilter(): void {
  this.selectedDate = null;
  this.applyFilter();
}
  loadCurrentUser(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any>(this.userApiUrl, { headers }).subscribe({
      next: (res) => {
        this.currentUserEmail = res.model?.email || null;
        this.userId = res.model?.userId;
        if (this.currentUserEmail) {
          this.fetchMeetings();
        }
      },
      error: () => localStorage.removeItem('token')
    });
  }
  loadUserSubscriptionDetails() {
    this.http.get<any>(`${environment.apiBaseUrl}/api/Membership/user-plan/${this.userId}`).subscribe({
      next: (res) => {
        this.planSessionLimit = res.recordedMeetings; 
        console.log(this.planSessionLimit);
        this.checkUserLiveSessionCount();              
      },
      error: (err) => {
        console.error('Subscription fetch error', err);
      }
    });
  }

  checkUserLiveSessionCount() {
    this.http.get<any[]>(`${environment.apiBaseUrl}/api/Membership/user-meetings/${this.userId}`).subscribe({
      next: (res) => {
        this.userReportCount = res.length;
        
        if (this.userReportCount >= this.planSessionLimit) {
           this.isLimitReached = true; 
          this.showPlanLimitReachedPopup(); 
        }else {
        this.isLimitReached = false;
      }
      },
      error: (err) => {
        console.error('Error fetching user sessions', err);
      }
    });
  }
  showPlanLimitReachedPopup() {
    Swal.fire({
      icon: 'warning',
      title: 'Plan Limit Reached',
      text: 'You have reached the maximum number of recorded meetings allowed in your current plan. Please upgrade your plan to access more recorded meetings and unlock download options.',
      confirmButtonText: 'Upgrade Plan',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/pricing']);
      }
    });
  }

  fetchMeetings(): void {
    const token = localStorage.getItem('token');
    if (!token || !this.currentUserEmail) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any[]>(`${this.meetingsApiUrl}?email=${this.userId}`, { headers }).subscribe({
      next: (res) => {
        this.meetings = res;
        this.filteredMeetings = res;
        this.totalPages = Math.ceil(this.filteredMeetings.length / this.pageSize);
        this.paginateReports();
      },
      
      error: (err) => {
        console.error('Error fetching meetings:', err);
        // Swal.fire({
        //   title: 'Error!',
        //   text: 'Could not fetch meeting records. Please try again later.',
        //   icon: 'error'
        // });
      }
    });
  }
  private base64ToText(base64: string): string {
    try {
      const byteCharacters = atob(base64);
      return decodeURIComponent(
        Array.from(byteCharacters)
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (e) {
      console.error('Base64 decode error:', e);
      return 'Unable to decode summary.';
    }
  }
  downloadSummary(report: any): void {
    if (!report.summaryFileBase64 || !report.summaryFileName) {
      console.error("Missing file data.");
      return;
    }

    const byteCharacters = atob(report.summaryFileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'text/plain' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = report.summaryFileName;
    link.click();

    window.URL.revokeObjectURL(link.href);
  }
  viewSummary(report: any): void {
    if (!report.summaryFileBase64) {
      Swal.fire('Error', 'Summary file is missing.', 'error');
      return;
    }
    const summaryText = this.base64ToText(report.summaryFileBase64);

    // Convert summary text to formatted HTML
    const formattedHtml = this.formatSummary(summaryText);

    // Set content inside modal
    const contentEl = document.getElementById('summaryContent');
    if (contentEl) {
      contentEl.innerHTML = formattedHtml; // use innerHTML for formatting
    }

    // Show Bootstrap modal
    const modalEl = document.getElementById('summaryModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl, {
        backdrop: 'static',
        keyboard: true
      });
      modal.show();
    }
  }

  private formatSummary(text: string): string {
    // Escape HTML special chars first to prevent injection
    let safeText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold formatting: **text**
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Split into lines and convert '-' lines to bullet points
    const lines = safeText.split(/\r?\n/);
    let html = "<ul style='padding-left:20px;'>";
    for (const line of lines) {
      if (line.trim().startsWith("-")) {
        html += `<li>${line.trim().substring(1).trim()}</li>`;
      } else if (line.trim()) {
        html += `<p>${line}</p>`;
      }
    }
    html += "</ul>";

    return html;
  }

   // Download Transcript
  downloadTranscript(report: any): void {
    if (!report.transcriptFileBase64 || !report.transcriptFileName) {
      console.error("Missing transcript file data.");
      return;
    }

    const byteCharacters = atob(report.transcriptFileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'text/plain' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = report.transcriptFileName;
    link.click();

    window.URL.revokeObjectURL(link.href);
  }

  // View Transcript 
  viewTranscript(report: any): void {
    if (!report.transcriptFileBase64) {
      Swal.fire('Error', 'Transcript file is missing.', 'error');
      return;
    }

    const transcriptText = this.base64ToText(report.transcriptFileBase64);

    const contentEl = document.getElementById('transcriptContent');
    if (contentEl) {
      contentEl.textContent = transcriptText; 
    }

    const modalEl = document.getElementById('transcriptModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl, {
        backdrop: 'static',
        keyboard: true
      });
      modal.show();
    }
  }

  paginateReports(): void {
  const start = (this.currentPage - 1) * this.pageSize;
  const end = start + this.pageSize;
  this.paginatedReports = this.filteredMeetings.slice(start, end);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.paginateReports();
  }

  recordMeeting(): void {
    
    console.log("Navigate to record new meeting.");
  }
}
