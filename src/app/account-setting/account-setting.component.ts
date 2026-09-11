import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment';
@Component({
  selector: 'app-account-setting',
  standalone: true, 
  imports: [HttpClientModule, RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './account-setting.component.html',
  styleUrls: ['./account-setting.component.css']
})
export class AccountSettingComponent implements OnInit {
  profileForm!: FormGroup;
  resetPasswordForm!: FormGroup;
  changeEmailForm!: FormGroup;
  updateNameForm!: FormGroup;

  selectedFile: File | null = null;
  currentUserEmail: string | null = null;
  currentUser: any = null;
  
  token: string | null = null;
  userId: string = ''; 

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {}

  ngOnInit() {
    this.loadCurrentUser();

    this.profileForm = this.fb.group({
      profilePhoto: [null, Validators.required]
    });
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', [Validators.required]]
    });
    this.changeEmailForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]],
      confirmEmail: ['', [Validators.required, Validators.email]],
    }, { validator: this.emailsMatchValidator });
    
    this.updateNameForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required]
    });

    this.updateNameForm.patchValue({
      firstName: this.currentUser.displayName,
      lastName: this.currentUser.lastName
    });
  }

  emailsMatchValidator(group: FormGroup) {
    const newEmail = group.get('newEmail')?.value;
    const confirmEmail = group.get('confirmEmail')?.value;
    return newEmail === confirmEmail ? null : { emailsMismatch: true };
  }
  // Trigger file input click event
  triggerFileInput() {
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    fileInput?.click();
  }

  // Handle file selection
  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      this.selectedFile = file;
      this.previewImage(file);  // Preview the selected image
      this.profileForm.patchValue({ profilePhoto: file });  // Set the file value in the form
      this.profileForm.get('profilePhoto')?.updateValueAndValidity();  // Ensure validity
    } else {
      alert('Only JPG/PNG images are allowed.');
      this.profileForm.patchValue({ profilePhoto: null });  // Reset the file input
    }
  }

  // Preview the selected image
  previewImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      document.querySelector(".image-input-wrapper")!.setAttribute('style',
        `background-image: url('${e.target.result}'); background-size: cover; background-position: center;`
      );
    };
    reader.readAsDataURL(file);
  }

  saveProfilePhoto() {
    if (!this.profileForm.valid || !this.selectedFile) return;
  
    const formData = new FormData();
    formData.append('ProfilePhoto', this.selectedFile);
    formData.append('UserId', this.currentUser.userId);
  
    this.http.post(`${environment.apiBaseUrl}/api/SecurityMaster/UploadProfilePhoto`, formData)
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Profile Picture Updated',
            text: 'Your profile photo has been uploaded successfully!',
            confirmButtonColor: '#3085d6'
          });
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: 'Something went wrong while uploading.',
            confirmButtonColor: '#d33'
          });
        }
      });
  }
  

  // Load the current user's data
  loadCurrentUser() {
    const token = localStorage.getItem('token');
    this.token = token;
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(`${environment.apiBaseUrl}/api/SecurityMaster`, { headers }).subscribe({
      next: (res) => {
        this.currentUser = res.model || null;
        this.currentUserEmail = res.model?.email || null;
        this.userId = res.model?.userId;
        if (this.currentUser) {
          this.updateNameForm.patchValue({
            firstName: this.currentUser.displayName,
            lastName: this.currentUser.lastName
          });
        }
        // Now make second call to get profile image by user ID
        const userId = res.model?.userId;
        if (userId) {
          this.http.get<any>(`${environment.apiBaseUrl}/api/SecurityMaster/GetUserProfileImage/${userId}`, { headers })
            .subscribe((imgRes) => {
              const path = imgRes?.imagePath;
              console.log(path);
              const imgElement = document.querySelector(".image-input-wrapper");

              if (path && imgElement) {
               imgElement.setAttribute('style',
                `background-image: url('${environment.apiBaseUrl}/${path}'); background-size: cover; background-position: center;`
              );

              } else {
                // Set default if no image
                imgElement?.setAttribute('style',
                  `background-image: url('/assets/logos/blank.png'); background-size: cover; background-position: center;`
                );
              }
            });
        }
      },
      error: () => {
        localStorage.removeItem('token');
      }
    });
  }

  onSubmitResetPassword() {
    if (this.resetPasswordForm.invalid) return;

    const newPassword = this.resetPasswordForm.value.newPassword;
    const confirmPassword = this.resetPasswordForm.value.confirmNewPassword;

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Mismatch',
        text: 'New password and confirm password do not match.'
      });
      return;
    }

    const payload = {
      email: this.currentUserEmail,
    
      newPassword: newPassword
    };

    this.http.post<any>(`${environment.apiBaseUrl}/api/SecurityMaster/changepassword`, payload)
      .subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: 'Password Reset',
            text: 'Your password has been successfully updated.'
          });
          this.resetPasswordForm.reset();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Reset Failed',
            text: err.error?.message || 'Something went wrong. Please try again later.'
          });
        }
      });
  }

  submitEmailForm() {
    if (this.changeEmailForm.invalid) {
      this.changeEmailForm.markAllAsTouched();
      return;
    }
  
   
    const formData = {
      currentEmail: this.currentUserEmail,
      newEmail: this.changeEmailForm.value.newEmail,
      password: "heloo1234"
    };
  
    this.http.post<any>(`${environment.apiBaseUrl}/api/SecurityMaster/changeemail`, formData).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: 'Email Changed Successfully',
          html: 'Please verify your new email to continue.<br><br>' +
                '<button class="btn btn-success" id="loginBtn">Verify Email</button>',
          showConfirmButton: false,
          didOpen: () => {
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
              loginBtn.addEventListener('click', () => {
                Swal.close();
                this.router.navigate(['/verify-email'],{ queryParams: { email: this.changeEmailForm.value.newEmail } });
              });
            }
          }
        });
      },
      error: (err) => {
        Swal.fire('Error', err.error || 'Failed to change email.', 'error');
      }
    });
  }
  
  submitNameForm(): void {
    if (this.updateNameForm.invalid) {
      this.updateNameForm.markAllAsTouched();
      return;
    }
  
    const payload = {
      userId: this.userId,
      firstName: this.updateNameForm.value.firstName,
      lastName: this.updateNameForm.value.lastName
    };
  
    this.http.put<any>(`${environment.apiBaseUrl}/api/SecurityMaster/update-name`, payload).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Name Updated!',
          text: 'Your account name has been successfully updated.',
          showConfirmButton: true,
          confirmButtonColor: '#50cd89', // Metronic green
          
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: err.error?.message || 'An unexpected error occurred while updating your name.',
          showConfirmButton: true,
          confirmButtonColor: '#f1416c', // Metronic red
         
        });
      }
    });
  }
  
}
