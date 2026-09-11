//footer.component.ts

import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';


declare var bootstrap: any;
@Component({
  selector: 'app-footer',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit {
 supportForm!: FormGroup;
  message = '';
  isSubmitting = false;
  
   constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private renderer: Renderer2,
    private cdRef: ChangeDetectorRef 
    ) {
      
    }
 

    ngOnInit(): void {
    
      this.supportForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        subject: ['', Validators.required],
        message: ['', Validators.required]
      });
    }

     submitSupportForm(): void {
        if (this.supportForm.invalid) {
          this.supportForm.markAllAsTouched();
          return;
        }
    
        this.isSubmitting = true;
    
        // this.http.post<any>(this.apiUrlSupport, this.supportForm.value).subscribe({
        //   next: (res) => {
        //     this.message = res.message;
        //     this.isSubmitting = false;
        //     this.supportForm.reset();
    
        //     Swal.fire({
        //       icon: 'success',
        //       title: 'Success!',
        //       text: 'Your support request has been submitted.',
        //       confirmButtonColor: '#3085d6'
        //     });
    
          
        //     const modalElement = document.getElementById('kt_modal_new_ticket');
        //     const modal = bootstrap.Modal.getInstance(modalElement!);
        //     modal?.hide();
        //   },
        //   error: (err) => {
        //     this.message = err.error?.message || "Something went wrong.";
        //     this.isSubmitting = false;
    
        //     Swal.fire({
        //       icon: 'error',
        //       title: 'Oops...',
        //       text: 'Failed to submit support request!',
        //       confirmButtonColor: '#d33'
        //     });
        //   }
        // });
      }

}