import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment';
@Component({
  selector: 'app-subscription-callback',
  standalone: true, 
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './subscription-callback.component.html',
  styleUrl: './subscription-callback.component.css'
})
export class SubscriptionCallbackComponent implements OnInit {

  private userApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster`;
  private subscriptionApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster/save-subscription`;

  currentUser: any;
  userId: any;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const plan = params['plan'];
      if (plan) {
        this.loadCurrentUser(() => this.subscribeToPlan(plan));
      } else {
        this.router.navigate(['/home']);
      }
    });
  }

  loadCurrentUser(callback?: () => void) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("No token found, user not logged in.");
      this.router.navigate(['/login']);
      return;
    }

    let headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(this.userApiUrl, { headers }).subscribe({
      next: (user) => {
        this.currentUser = user.model;
        this.userId = user.model?.userId;
        if (callback) callback();
      },
      error: (error) => {
        console.error("Error fetching current user:", error);
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
      }
    });
  }

  subscribeToPlan(plan: string) {
    if (!this.currentUser) {
      console.error("No user loaded. Cannot send subscription request.");
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const requestBody = {
      PlanName: plan,
      Email: this.currentUser.userId
    };

    this.http.post(this.subscriptionApiUrl, requestBody, { headers }).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Subscription Successful!',
          text: `You have successfully upgraded to ${plan} plan.`,
          confirmButtonText: 'Go to Application'
        }).then(() => {
          this.router.navigate(['/multi-step-interview']);
        });
      },
      error: (error) => {
        console.error("Error saving subscription", error);
        Swal.fire({
          icon: 'error',
          title: 'Subscription Failed',
          text: 'Something went wrong while saving your subscription.',
        }).then(() => {
          this.router.navigate(['/home']);
        });
      }
    });
  }
}