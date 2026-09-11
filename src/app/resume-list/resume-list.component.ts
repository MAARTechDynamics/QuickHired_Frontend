import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

interface Resume {
  id: string;
  resumeName: string;
  createdUtc: string;
  updatedUtc: string;
}
@Component({
  selector: 'app-resume-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule,FormsModule],
  templateUrl: './resume-list.component.html',
  styleUrl: './resume-list.component.css'
})
export class ResumeListComponent implements OnInit {
  resumes: Resume[] = [];
  filteredResumes: Resume[] = [];
  paginatedResumes: Resume[] = [];

  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 5;
  totalPages: number = 1;

  userId: string = ""; 
  currentUserEmail: string = "";  
  private userApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster`;
  constructor(private http: HttpClient, private router: Router) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.loadCurrentUser(); 
      this.fetchResumes();          
    } catch (err) {
      console.error("Failed to load user", err);
    }
  }


  loadCurrentUser(): Promise<void> {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');
    if (!token) {
      reject("No token found");
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any>(this.userApiUrl, { headers }).subscribe({
      next: (res) => {
        this.currentUserEmail = res.model?.email || null;
        this.userId = res.model?.userId;
        console.log("User loaded:", this.userId);
        resolve(); 
      },
      error: (err) => {
        localStorage.removeItem('token');
        reject(err);
      }
    });
  });
  }

  fetchResumes() {
  if (!this.userId) {
    console.warn("No userId available, skipping fetch");
    return;
  }

  this.http.get<Resume[]>(`${environment.apiBaseUrl}/api/resumes/by-user/${this.userId}`).subscribe({
    next: (data) => {
      this.resumes = data;
      this.applyFilter();
    },
    error: (err) => {
      console.error('Error fetching resumes', err);
    }
  });
  }


  applyFilter() {
    const term = this.searchTerm.toLowerCase();
    this.filteredResumes = this.resumes.filter(r =>
      r.resumeName.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredResumes.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedResumes = this.filteredResumes.slice(start, start + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  formatDate(date: string): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    };
    return new Date(date).toLocaleString('en-US', options).replace(',', ' at');
  }

  viewResume(resumeId: string) {
    this.router.navigate(['/resume'], { queryParams: { id: resumeId } });
  }
}
