import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-users',
 standalone: true, 
  imports: [HttpClientModule, RouterModule, CommonModule, ReactiveFormsModule,FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
userSubscriptions: any[] = [];
  apiUrl = `${environment.apiBaseUrl}/api/Membership`;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUserSubscriptions();
  }

  loadUserSubscriptions() {
    this.http.get<any[]>(`${this.apiUrl}/get-all-user-subscriptions`).subscribe(res => {
      this.userSubscriptions = res;
    });
  }
  formatPlanName(planName: string | undefined): string {
    if (!planName) return '';
    return planName.replace(/(Standard|Pro)(Annual)/, '$1 $2');
  }
  isValidDate(date: any): boolean {
  return date && !isNaN(new Date(date).getTime());
}

  getBadgeClass(planName: string): string {
    if (planName.includes('Free')) return 'badge-light-primary';
    if (planName.includes('Pro')) return 'badge-light-success';
    if (planName.includes('ProAnnual')) return 'badge-light-danger';
    if (planName.includes('Standard')) return 'badge-light-warning';
    if (planName.includes('StandardAnnual')) return 'badge-light-warning';
    return 'badge-light-secondary';
  }
}
