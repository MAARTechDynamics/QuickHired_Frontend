import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';
import { jsPDF } from 'jspdf';
import { environment } from '../environments/environment';

declare var $: any;
@Component({
  selector: 'app-interview-reports',
  standalone: true, 
  imports: [HttpClientModule, RouterModule, CommonModule, ReactiveFormsModule,FormsModule],
  templateUrl: './interview-reports.component.html',
  styleUrl: './interview-reports.component.css'
})
export class InterviewReportsComponent implements OnInit {
  reports: any[] = [];
  filteredReports: any[] = [];
  interviewTypes: string[] = ['All', 'Mock', 'Live'];
  selectedType: string = 'All';
  currentUserEmail: string | null = null;
  chartInstance: Chart | null = null;
  chartImageDataUrl: string = '';
  searchTerm: string = '';
  pageSize: number = 10;
  currentPage: number = 1;
  userId:string ="";
  private userApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster`;
  planSessionLimit = 0;
  userReportCount = 0;
  isLimitReached: boolean = false;
  selectedReport: any = null;
  showDetails: boolean = false;
  constructor(private http: HttpClient, private route: ActivatedRoute, private router:Router) {
    Chart.register(...registerables);
  }

 ngOnInit(): void {
  this.loadCurrentUser();
}

loadCurrentUser(): void {
  const token = localStorage.getItem('token');
  if (!token) return;

  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  this.http.get<any>(this.userApiUrl, { headers }).subscribe({
    next: (res) => {
      this.currentUserEmail = res.model?.email || null;
      this.userId = res.model?.userId;
      if (this.userId) {
        this.fetchReports();
      }
    },
    error: () => localStorage.removeItem('token')
  });
}

fetchReports(): void {
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  this.http.post<any[]>(`${environment.apiBaseUrl}/api/InterviewReports/GetUserReportsByEmail`, { email: this.userId }, { headers })
    .subscribe(data => {
      this.reports = data || [];
      this.filteredReports = [...this.reports];
      this.originalReports = [...this.reports];
      this.currentPage = 1;

      // ✅ Load plan details *after* reports are ready
      this.loadUserSubscriptionDetails();
    });
}

  ngAfterViewInit() {
    setTimeout(() => {
      
  
      $('#typeSelect').select2({
        minimumResultsForSearch: -1,
        width: '100%'
      }).on('change', (e: any) => {
        this.selectedType = e.target.value;
        this.applyFilter(); // call filter method on change
      });
    });
  }
  

  // loadCurrentUser(): void {
  //   const token = localStorage.getItem('token');
  //   if (!token) return;

  //   const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  //   this.http.get<any>(this.userApiUrl, { headers }).subscribe({
  //     next: (res) => {
  //       this.currentUserEmail = res.model?.email || null;
  //       this.userId = res.model?.userId;
  //       console.log(this.userId)
  //       if (this.userId) {
  //         this.fetchReports();
  //       }
  //     },
  //     error: () => localStorage.removeItem('token')
  //   });
  // }
  loadUserSubscriptionDetails() {
    this.http.get<any>(`${environment.apiBaseUrl}/api/Membership/user-plan/${this.userId}`).subscribe({
      next: (res) => {
        this.planSessionLimit = res.interviewReports;      // e.g., 3
       
        this.checkUserLiveSessionCount();              
      },
      error: (err) => {
        console.error('Subscription fetch error', err);
      }
    });
  }

  checkUserLiveSessionCount() {
    this.http.get<any[]>(`${environment.apiBaseUrl}/api/Membership/user-reports/${this.userId}`).subscribe({
      next: (res) => {
        this.userReportCount = res.length;
        console.log(this.userReportCount);
        if (this.userReportCount >= this.planSessionLimit) {
           this.isLimitReached = true; 
          this.showPlanLimitReachedPopup();
        }else{
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
      text: 'You have reached the maximum number of interview reports allowed in your current plan. Please upgrade your plan to view additional reports and download their transcripts.',
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

  get paginatedReports(): any[] {
  if (!this.filteredReports) return [];

  const startIndex = (this.currentPage - 1) * this.pageSize;
  const endIndex = startIndex + this.pageSize;

  return this.filteredReports.slice(startIndex, endIndex);
}

get totalPages(): number {
  return Math.ceil(this.filteredReports.length / this.pageSize);
}
  
  changePage(page: number): void {
    this.currentPage = page;
  }
  selectedDate: string | null = null;
  originalReports: any[] = [];


  // applyFilter(): void {
  //   this.currentPage = 1; // Reset to first page
  // }
applyFilter(): void {
  if (!this.reports || this.reports.length === 0) return;

  const term = this.searchTerm.toLowerCase().trim();
  let filtered = [...this.reports];

  console.log('📋 Total reports:', this.reports.length);
  console.log('🔍 Search term:', term);
  console.log('🎯 Selected Type:', this.selectedType);
  console.log('📅 Selected Date (raw):', this.selectedDate);

  // Filter by type
  if (this.selectedType !== 'All') {
    filtered = filtered.filter(r => r.interviewType === this.selectedType);
  }

  // Filter by search term
  if (term) {
    filtered = filtered.filter(r =>
      r.persona?.companyName?.toLowerCase().includes(term)
    );
  }

  // ✅ Filter by date (compare only date part)
  if (this.selectedDate) {
    const selectedDateString = new Date(this.selectedDate).toISOString().split('T')[0];
    console.log('📅 Selected Date (ISO):', selectedDateString);

    filtered = filtered.filter(r => {
      const createdAt = r.createdAt;
      const reportDate = new Date(createdAt);
      const reportDateString = reportDate.toISOString().split('T')[0];

      console.log('🧾 Report Date Raw:', createdAt);
      console.log('🧾 Report Date ISO:', reportDateString);

      // Compare only date parts
      const match = reportDateString === selectedDateString;
      if (match) console.log('✅ MATCH FOUND:', reportDateString);
      return match;
    });
  }

  this.filteredReports = filtered;
  this.currentPage = 1;

  console.log('✅ Final Filtered Count:', this.filteredReports.length);
}








clearDateFilter(): void {
  this.selectedDate = null;
  this.filteredReports = this.originalReports; // ✅ Reset full list
  this.applyFilter(); // ✅ Reapply search/type filters (if any)
}











//   fetchReports(): void {
//   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

//   this.http
//     .post<any[]>(`${environment.apiBaseUrl}/api/InterviewReports/GetUserReportsByEmail`, { email: this.userId }, { headers })
//     .subscribe(data => {
//       this.reports = data;
//       this.filteredReports = data;
//       this.originalReports = data; // ✅ Keep a safe copy
//       this.currentPage = 1;
//     });
// }
  applyFilterB():void{
    if(this.selectedType === 'All') {
      this.filteredReports = this.reports;
    }else{
      this.filteredReports = this.reports.filter(r => r.interviewType == this.selectedType);
    }
  }
  fetchReportsMock():void{
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post<any[]>(`${environment.apiBaseUrl}/api/InterviewReports/GetUserReportsByEmail`,{email:this.userId},{ headers })
    .subscribe(data => {
      this.reports = data;
      this.currentPage = 1;
    })
  }

  viewReport(report: any): void {
    this.selectedReport = report;
    this.showDetails = true;
    
    // Scroll to top of page to show details
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Create chart after view is rendered
    setTimeout(() => {
      this.createScoreChart(report.scorePercentage || 0);
    }, 100);
  }

  closeDetails(): void {
    this.showDetails = false;
    this.selectedReport = null;
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  private createScoreChart(score: number): void {
    const canvas = document.getElementById('scoreChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [score, 100 - score],
          backgroundColor: ['#0d9488', '#e5e7eb'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        responsive: false,
        maintainAspectRatio: false,
        animation: {
          onComplete: () => {
            // Capture chart image after animation completes
            this.chartImageDataUrl = canvas.toDataURL('image/png');
          }
        }
      },
      plugins: [{
        id: 'centerText',
        beforeDraw: (chart: any) => {
          const width = chart.width;
          const height = chart.height;
          const ctx = chart.ctx;
          ctx.restore();
          const fontSize = (height / 120).toFixed(2);
          ctx.font = `bold ${fontSize}em Inter, sans-serif`;
          ctx.textBaseline = 'middle';
          const text = `${score}%`;
          const textX = Math.round((width - ctx.measureText(text).width) / 2);
          const textY = height / 2;
          ctx.fillStyle = '#1f2937';
          ctx.fillText(text, textX, textY);
          ctx.save();
        }
      }]
    });
  }

  viewReportOld(report: any): void {
    Swal.fire({
      title: '<div style="font-size: 2.5rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem;">📊 Interview Performance Report</div>',
      html: `
      <div style="display: flex; flex-direction: column; gap: 32px; max-width: 100%; text-align: left;">
        
        <!-- Header Info Card -->
        <div style="background: linear-gradient(135deg, #0d9488, #06b6d4); border-radius: 16px; padding: 40px; color: white;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 24px;">
            <div>
              <div style="font-size: 1.25rem; opacity: 0.9; margin-bottom: 8px;">Company</div>
              <div style="font-size: 1.875rem; font-weight: 600;">${report.persona?.companyName || 'N/A'}</div>
            </div>
            <div>
              <div style="font-size: 1.25rem; opacity: 0.9; margin-bottom: 8px;">Role</div>
              <div style="font-size: 1.875rem; font-weight: 600;">${report.persona?.jobTitle || 'N/A'}</div>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.2);">
            <div>
              <div style="font-size: 1.125rem; opacity: 0.9; margin-bottom: 8px;">Type</div>
              <div style="font-size: 1.5rem; font-weight: 600;">${report.interviewType}</div>
            </div>
            <div>
              <div style="font-size: 1.125rem; opacity: 0.9; margin-bottom: 8px;">Domain</div>
              <div style="font-size: 1.5rem; font-weight: 600;">${report.persona?.interviewDomain || 'N/A'}</div>
            </div>
            <div>
              <div style="font-size: 1.125rem; opacity: 0.9; margin-bottom: 8px;">Duration</div>
              <div style="font-size: 1.5rem; font-weight: 600;">${report.duration}</div>
            </div>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
            <div style="font-size: 1.125rem; opacity: 0.9; margin-bottom: 8px;">Interview Date</div>
            <div style="font-size: 1.5rem; font-weight: 600;">${new Date(report.createdAt).toLocaleString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true
            }).replace(',', ' at')}</div>
          </div>
        </div>

        <!-- Score Section -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 40px; padding: 40px; background: #f8fafc; border-radius: 16px;">
          <div style="text-align: center;">
            <div style="font-size: 1.5rem; color: #6b7280; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Overall Score</div>
            <canvas id="scoreChart" width="280" height="280" style="max-width: 280px;"></canvas>
          </div>
        </div>

        <!-- Improvements Section -->
        <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(74, 222, 128, 0.05)); border-left: 6px solid #22c55e; border-radius: 16px; padding: 32px;">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <h5 style="margin: 0; font-size: 1.75rem; font-weight: 700; color: #22c55e;">Strengths & Improvements</h5>
          </div>
          <div style="font-size: 1.375rem; line-height: 1.8; color: #1f2937; white-space: pre-wrap;">${report.improvements || 'No data available'}</div>
        </div>

        <!-- Weaknesses Section -->
        <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(248, 113, 113, 0.05)); border-left: 6px solid #ef4444; border-radius: 16px; padding: 32px;">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h5 style="margin: 0; font-size: 1.75rem; font-weight: 700; color: #ef4444;">Areas for Development</h5>
          </div>
          <div style="font-size: 1.375rem; line-height: 1.8; color: #1f2937; white-space: pre-wrap;">${report.weaknesses || 'No data available'}</div>
        </div>

      </div>
    `,
      width: '95vw',
      showCancelButton: true,
      cancelButtonText: 'Close',
      confirmButtonText: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export PDF',
      customClass: {
        popup: 'report-popup-custom',
        confirmButton: 'btn-export-pdf',
        cancelButton: 'btn-close-modal'
      },
      didOpen: () => {
        const canvas = document.getElementById('scoreChart') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');

        this.chartInstance = new Chart(ctx!, {
          type: 'doughnut',
          data: {
            labels: ['Score', 'Remaining'],
            datasets: [{
              data: [report.scorePercentage, 100 - report.scorePercentage],
              backgroundColor: ['#4caf50', '#e0e0e0']
            }]
          },
          options: {
            cutout: '70%',
            plugins: {
              tooltip: { enabled: false },
              legend: { display: false },
            }
          },
          plugins: [{
            id: 'centerText',
            beforeDraw: function (chart) {
              const { width, height, ctx } = chart;
              ctx.restore();
              const fontSize = (height / 100).toFixed(2);
              ctx.font = `${fontSize}em sans-serif`;
              ctx.textBaseline = 'middle';
              const text = `${report.scorePercentage}%`;
              const textX = Math.round((width - ctx.measureText(text).width) / 2);
              const textY = height / 2;
              ctx.fillText(text, textX, textY);
              ctx.save();
            }
          }]
        });
        setTimeout(() => {
          this.chartImageDataUrl = canvas.toDataURL('image/png'); 
        }, 300);
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.exportReportPDF(report);
      }
    });
  }

  exportCurrentReport(): void {
    if (this.selectedReport) {
      this.exportReportPDF(this.selectedReport);
    }
  }

  exportReportPDF(report: any): void {
    if (!this.chartImageDataUrl) {
      Swal.fire('Error', 'Chart not ready yet. Please try again.', 'error');
      return;
    }

    Swal.fire({
      title: 'Exporting...',
      text: 'Please wait while the report is being generated.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setTimeout(() => {
      const doc = new jsPDF();
      const companyName = report.persona?.companyName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Report';

      // Add basic report details
      const content = [
        `Interview Type: ${report.interviewType}`,
        `Domain: ${report.persona?.interviewDomain || 'N/A'}`,
        `Duration: ${report.duration}`,
        `Date: ${new Date(report.createdAt).toLocaleString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true
        }).replace(',', ' at')}`,
        `Score Percentage: ${report.scorePercentage}%`,
      ];

      doc.setFont('helvetica');
      doc.setFontSize(12);
      let y = 20;

      content.forEach((line) => {
        doc.text(line, 10, y);
        y += 10;
      });

      // Add the chart image
      doc.addImage(this.chartImageDataUrl, 'PNG', 120, 20, 70, 70); // adjust size as needed

      // Add Improvements section
      y = y < 100 ? 100 : y + 20;
      doc.setFontSize(13);
      doc.setTextColor(0, 128, 0); // green
      doc.text(' Improvements', 10, y);
      y += 8;
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(doc.splitTextToSize(report.improvements || 'N/A', 180), 10, y);
      y += (report.improvements?.length ?? 0) > 100 ? 30 : 15;

      // Add Weaknesses section
      doc.setFontSize(13);
      doc.setTextColor(200, 0, 0); // red
      doc.text(' Weaknesses', 10, y);
      y += 8;
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(doc.splitTextToSize(report.weaknesses || 'N/A', 180), 10, y);

      // Save the document
      doc.save(`${companyName}_Report.pdf`);

      Swal.fire({
        icon: 'success',
        title: 'Exported!',
        text: 'Your report has been exported.',
        timer: 5000,
        showConfirmButton: false
      });
    }, 800);
  }
  downloadSummary(report: any): void {
    if (!report.transcriptFileBase64 || !report.transcriptFileName) {
      console.error("Missing file data.");
      return;
    }
  
    const byteCharacters = atob(report.transcriptFileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
  
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'text/plain' });
  
    
    const companyName = report.persona?.companyName?.replace(/[^a-zA-Z0-9]/g, '_') || 'UnknownCompany';
    const originalFileName = report.transcriptFileName.replace(/\s+/g, '_');
    const finalFileName = `${companyName}_${originalFileName}`;
  
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = finalFileName;
    link.click();
  
    window.URL.revokeObjectURL(link.href);
  }
  
  
}
