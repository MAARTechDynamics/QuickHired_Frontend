import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment';
@Component({
  selector: 'app-promo-codes',
  standalone: true,
  imports: [HttpClientModule, RouterModule, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './promo-codes.component.html',
  styleUrl: './promo-codes.component.css'
})
export class PromoCodesComponent implements OnInit {
  promoCodes: any[] = [];
  editingPromo: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadPromoCodes();
  }

  loadPromoCodes() {
    this.http.get(`${environment.apiBaseUrl}/api/PromoCodes`).subscribe((res: any) => {
      this.promoCodes = res;
    });
  }

 openModal(mode: 'add' | 'edit', promo: any = null) {
  if (promo) {
    this.editingPromo = {
      ...promo,
      expirationDate: this.formatDateForInput(promo.expirationDate)
    };
  } else {
    this.editingPromo = {};
  }

  const modalEl = document.getElementById('promoModal');
  if (modalEl) {
    modalEl.classList.add('show');
    modalEl.style.display = 'block';
    modalEl.removeAttribute('aria-hidden');
    modalEl.setAttribute('aria-modal', 'true');
    document.body.classList.add('modal-open');
  }
 }
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // 01–12
    const day = ('0' + date.getDate()).slice(-2); // 01–31

    return `${year}-${month}-${day}`;
  }
 
  closeModal() {
    const modalEl = document.getElementById('promoModal');
    if (modalEl) {
      modalEl.classList.remove('show');
      modalEl.style.display = 'none';
      modalEl.setAttribute('aria-hidden', 'true');
      modalEl.removeAttribute('aria-modal');
      document.body.classList.remove('modal-open');
    }
  }

  savePromo() {
    const promo = this.editingPromo;
    if (promo.id) {
      this.http.put(`${environment.apiBaseUrl}/api/PromoCodes/${promo.id}`, promo).subscribe(() => {
        this.loadPromoCodes();
        this.closeModal();
        Swal.fire('Updated!', 'Promo code has been updated.', 'success');
      });
    } else {
      this.http.post(`${environment.apiBaseUrl}/api/PromoCodes`, promo).subscribe(() => {
        this.loadPromoCodes();
        this.closeModal();
        Swal.fire('Created!', 'New promo code has been created.', 'success');
      });
    }
  }

  


  deletePromo(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action will delete the promo code permanently!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${environment.apiBaseUrl}/api/PromoCodes/${id}`).subscribe(() => {
          this.loadPromoCodes();
          Swal.fire('Deleted!', 'Promo code has been deleted.', 'success');
        });
      }
    });
  }

 
  getBadgeClass(name: string) {
    switch (name) {
      case 'Free': return 'badge bg-success';
      case 'Standard': return 'badge bg-warning';
      case 'StandardAnnual': return 'badge bg-info';
      case 'Monthly Plan Yearly': return 'badge bg-primary';
      default: return 'badge bg-secondary';
    }
  }
}
