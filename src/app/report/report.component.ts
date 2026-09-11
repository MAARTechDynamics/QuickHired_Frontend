import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [HttpClientModule, RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent implements OnInit {
  reportForm: FormGroup;
  years: number[] = [];
  months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];
  subscriptions: string[] = ["All", "Free", "Standard", "StandardAnnual", "Pro", "ProAnnual"];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.reportForm = this.fb.group({
      year: [new Date().getFullYear(), Validators.required],
      month: [new Date().getMonth() + 1, Validators.required], 
      subscriptionName: ['All', Validators.required]           
    });

  }

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 20; year <= currentYear + 50; year++) {
      this.years.push(year);
    }
  }

  generateReport(): void {
    if (this.reportForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please select year, month, and subscription.'
      });
      return;
    }

    const { year, month, subscriptionName } = this.reportForm.value;

    this.http.post(`${environment.apiBaseUrl}/api/Membership/generate`, { year, month, subscriptionName }, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const fileName = `Monthly_Report_${year}_${month}.xlsx`;
          const downloadLink = document.createElement('a');
          const url = window.URL.createObjectURL(blob);
          downloadLink.href = url;
          downloadLink.download = fileName;
          downloadLink.click();
          window.URL.revokeObjectURL(url);

          Swal.fire({
            icon: 'success',
            title: 'Report Generated',
            text: 'Your report has been downloaded successfully!'
          });
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error generating report!'
          });
        }
      });
  }
}
