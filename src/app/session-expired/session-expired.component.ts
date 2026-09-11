import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-session-expired',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './session-expired.component.html',
  styleUrl: './session-expired.component.css'
})
export class SessionExpiredComponent implements OnInit {

  constructor(private renderer: Renderer2, private router: Router) { }

  ngOnInit(): void {
    // Add blur class to body
    this.renderer.addClass(document.body, 'blurred');

    Swal.fire({
      title: 'Session Expired',
      text: 'Your session has expired after the selected interview limit. Please start a new session to continue.',
      icon: 'warning',
      confirmButtonText: 'Go Back',
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'btn btn-primary'
      }
    }).then(() => {
      // Remove blur when SweetAlert closes
      this.renderer.removeClass(document.body, 'blurred');
      this.router.navigate(['/multi-step-interview']); 
    });
  }
}
