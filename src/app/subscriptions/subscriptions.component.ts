import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-subscriptions',
   standalone: true, 
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.css']
})
export class SubscriptionsComponent implements OnInit {

  subscriptions: any[] = [];
  selectedSubscription: any = {};
  showModal = false;
  apiUrl = `${environment.apiBaseUrl}/api/Membership`; 

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions() {
    this.http.get<any[]>(`${this.apiUrl}/get-all-subscriptions`).subscribe(res => {
      this.subscriptions = res;
      console.log(this.subscriptions);
    });
  }

  openModal(subscription: any) {
    this.selectedSubscription = { ...subscription }; 
    this.showModal = true;
    const modal = document.getElementById('subscriptionModal') as any;
    if (modal) modal.style.display = 'block';
  }

  closeModal() {
     this.showModal = false;
    const modal = document.getElementById('subscriptionModal') as any;
    if (modal) modal.style.display = 'none';
  }
  formatPlanName(planName: string | undefined): string {
    if (!planName) return '';
    return planName.replace(/(Standard|Pro)(Annual)/, '$1 $2');
  }
    updateSubscription(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched(); 
      return;
    }

    this.http.put(`${this.apiUrl}/update-subscription/${this.selectedSubscription.id}`, this.selectedSubscription)
        .subscribe(() => {
          this.closeModal();
          this.loadSubscriptions();
          Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Subscription updated successfully.',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
      });
  }

}
