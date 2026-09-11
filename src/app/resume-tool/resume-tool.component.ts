import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import html2pdf from 'html2pdf.js';
import { environment } from '../environments/environment';


interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  current: boolean;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string;
  link?: string;
}

interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    portfolio?: string;
    summary: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  certifications: string[];
  languages: string[];
}

@Component({
  selector: 'app-resume-tool',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule,FormsModule],
  templateUrl: './resume-tool.component.html',
  styleUrl: './resume-tool.component.css'
})

export class ResumeToolComponent implements OnInit {
  isEnhancing: boolean = false;
  isSaving = false; 
  newSkill: string = '';
  newCertification: string = '';
  newLanguage: string = '';
  currentUserEmail: string | null = null;
  userId: string = '';
  resumeId: string = '';

  private userApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster`;
 activeSection: string = 'personal';
 @ViewChild('resumePreview', { static: false }) resumePreview!: ElementRef;
 

 updateText(field: 'professional-summary' | 'job-description' | 'project-description' | 'skills', value: string, target?: any): void {
  if (!value.trim()) return;
  this.isEnhancing = true;


  this.http.post<{ polished: string }>(`${environment.apiBaseUrl}/api/AIInterview/enhance-text`, {
    text: value,
    type: field
  }).subscribe({
    next: (res) => {
      if (field === 'professional-summary') {
        this.resumeData.personalInfo.summary = res.polished;
      } else if (field === 'skills') {
        this.resumeData.skills = res.polished.split(',').map(s => s.trim()); 
      } else if (field === 'job-description' && target) {
        target.description = res.polished;
      } else if (field === 'project-description' && target) {
        target.description = res.polished;
      }
      Swal.fire("Enhanced!", `Your ${field} has been enhanced.`, "success");
      this.isEnhancing = false;

    },
    error: (err) => {
      console.error(err);
      Swal.fire("Error", "Failed to enhance text", "error");
      this.isEnhancing = false;

    }
  });
 }


  enhanceSkills(jobDscription: string | undefined, skills: string[]): void {
  if (!jobDscription || skills.length === 0) return;
  this.isEnhancing = true;

  this.http.post<{ polished: string }>(`${environment.apiBaseUrl}/api/AIInterview/enhance-skills`, {
    jobTitle: jobDscription,
    skills: skills
  }).subscribe({
    next: (res) => {
      this.resumeData.skills = res.polished.split(',').map(s => s.trim());
      Swal.fire("Enhanced!", "Your skills have been enhanced.", "success");
      this.isEnhancing = false;
    },
    error: (err) => {
      console.error(err);
      Swal.fire("Error", "Failed to enhance skills", "error");
      this.isEnhancing = false;
    }
  });
  }

  resumeData: ResumeData = {
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedIn: '',
      portfolio: '',
      summary: ''
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: []
  };

  
  constructor(private http: HttpClient, private route: ActivatedRoute, private router:Router) { }

  // ngOnInit(): void {
  //   this.loadCurrentUser();
  //   this.loadSampleData();
  // }

  ngOnInit(): void {
  this.loadCurrentUser();
   
    setTimeout(() => {
    if (this.userId) {
      this.checkSubscriptionAndLimit(this.userId);
    }
  }, 300);
  

  this.route.queryParams.subscribe(params => {
    const resumeId = params['id'];
    this.resumeId =resumeId;
    if (resumeId) {
      this.loadResumeFromBackend(resumeId);
    } else {
      this.loadSampleData();
    }
  });
  }
  loadResumeFromBackend(id: string): void {
    this.http.get<ResumeData>(`${environment.apiBaseUrl}/api/resumes/${id}`).subscribe({
      next: (data) => {
        // Map backend entity to your ResumeData format if needed
        this.resumeData = {
          personalInfo: {
            fullName: data.personalInfo?.fullName || '',
            email: data.personalInfo?.email || '',
            phone: data.personalInfo?.phone || '',
            location: data.personalInfo?.location || '',
            linkedIn: data.personalInfo?.linkedIn || '',
            portfolio: data.personalInfo?.portfolio || '',
            summary: data.personalInfo?.summary || ''
          },
          experience: data.experience || [],
          education: data.education || [],
          skills: data.skills || [],
          projects: data.projects || [],
          certifications: data.certifications || [],
          languages: data.languages || []
        };
      },
      error: (err) => {
        console.error("Failed to load resume", err);
        Swal.fire("Error", "Could not load resume from server. Loading sample data instead.", "error");
        this.loadSampleData();
      }
    });
  }

  loadCurrentUser() {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.get<any>(this.userApiUrl, { headers }).subscribe({
        next: (res) => {
          this.currentUserEmail = res.model?.email || null;
          this.userId = res.model?.userId;
        },
        error: () => localStorage.removeItem('token')
      });
  }
  loadSampleData(): void {
    this.resumeData = {
      personalInfo: {
        fullName: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        linkedIn: 'linkedin.com/in/johndoe',
        portfolio: 'johndoe.dev',
        summary: 'Passionate software engineer with 5+ years of experience in full-stack development, specializing in modern web technologies and cloud architecture.'
      },
      experience: [
        {
          id: '1',
          company: 'TechCorp Inc.',
          position: 'Senior Software Engineer',
          startDate: '2022-01',
          endDate: '',
          current: true,
          description: 'Lead development of scalable web applications using Angular, Node.js, and AWS. Mentored junior developers and improved system performance by 40%.'
        }
      ],
      education: [
        {
          id: '1',
          institution: 'University of California',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          graduationDate: '2019-05',
          gpa: '3.8'
        }
      ],
      skills: ['Angular', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
      projects: [
        {
          id: '1',
          name: 'E-commerce Platform',
          description: 'Built a full-stack e-commerce platform with real-time inventory management',
          technologies: 'Angular, Node.js, MongoDB, Stripe API',
          link: 'github.com/johndoe/ecommerce'
        }
      ],
      certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
      languages: ['English (Native)', 'Spanish (Intermediate)']
    };
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }
  canCreateResume: boolean = true;

  private checkSubscriptionAndLimit(userId: string): void {
   
    this.http.get<any>(`${environment.apiBaseUrl}/api/AIInterview/check-limit/${userId}`).subscribe({
      next: (res) => {
        const { planName, resumeCount, canCreateMore } = res;

        this.canCreateResume = canCreateMore;

        if (!canCreateMore) {
          this.showLimitReachedAlert(planName);
        }
      },
      error: (err) => {
        console.error("Failed to check resume limit", err);
        this.canCreateResume = true; // fallback
      }
    });
  }


  private showLimitReachedAlert(planName: string): void {
  Swal.fire({
    title: 'Plan limit reached',
    html: `<p>You are currently on the <strong>${planName}</strong> plan.</p>
          <p><strong>${planName}</strong> users can only create <strong>1 resume</strong>.</p>
          <p>Upgrade now to create unlimited resumes and unlock premium features.</p>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Upgrade Plan',
    cancelButtonText: 'Not now',
    confirmButtonColor: '#3085d6',
    allowOutsideClick: false
  }).then(result => {
    if (result.isConfirmed) {
      this.router.navigate(['/pricing']);
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      this.router.navigate(['/resume-list']);
    }
  });
}


  addExperience(): void {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    this.resumeData.experience.push(newExp);
  }

  removeExperience(id: string): void {
    this.resumeData.experience = this.resumeData.experience.filter(exp => exp.id !== id);
  }

  addEducation(): void {
    const newEdu: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      graduationDate: '',
      gpa: ''
    };
    this.resumeData.education.push(newEdu);
  }

  removeEducation(id: string): void {
    this.resumeData.education = this.resumeData.education.filter(edu => edu.id !== id);
  }

  addProject(): void {
    const newProject: Project = {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: '',
      link: ''
    };
    this.resumeData.projects.push(newProject);
  }

  removeProject(id: string): void {
    this.resumeData.projects = this.resumeData.projects.filter(proj => proj.id !== id);
  }

  addSkill(): void {
    if (this.newSkill.trim() && !this.resumeData.skills.includes(this.newSkill.trim())) {
      this.resumeData.skills.push(this.newSkill.trim());
      this.newSkill = '';
    }
  }

  removeSkill(skill: string): void {
    this.resumeData.skills = this.resumeData.skills.filter(s => s !== skill);
  }

  addCertification(): void {
    if (this.newCertification.trim() && !this.resumeData.certifications.includes(this.newCertification.trim())) {
      this.resumeData.certifications.push(this.newCertification.trim());
      this.newCertification = '';
    }
  }

  removeCertification(cert: string): void {
    this.resumeData.certifications = this.resumeData.certifications.filter(c => c !== cert);
  }

  addLanguage(): void {
    if (this.newLanguage.trim() && !this.resumeData.languages.includes(this.newLanguage.trim())) {
      this.resumeData.languages.push(this.newLanguage.trim());
      this.newLanguage = '';
    }
  }

  removeLanguage(lang: string): void {
    this.resumeData.languages = this.resumeData.languages.filter(l => l !== lang);
  }

  onCurrentJobChange(experience: Experience): void {
    if (experience.current) {
      experience.endDate = '';
    }
  }

  exportResume(): void {
  const resumeElement = this.resumePreview.nativeElement;

  // Export mode class add
  resumeElement.classList.add("exporting");

  const fullName = this.resumeData.personalInfo.fullName?.trim() || "My";
  const safeName = fullName.replace(/\s+/g, "_"); 
  const fileName = `${safeName}_Resume.pdf`;

  const opt = {
    
    filename: fileName,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'p' as any },
    pagebreak: { mode: ['avoid-all', 'css'] },
    
 
  };

  html2pdf()
    .set(opt)
    .from(resumeElement)
    .save()
    .then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Exported!',
        text: `Your "${safeName}" resume has been exported successfully.`,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
    })
    .catch((err: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Failed to export resume!',
      });
      console.error(err);
    })
    .finally(() => {
      // Normal mode pe wapas
      resumeElement.classList.remove("exporting");
    });
}
  getAllDescriptions(experiences: any[]): string {
    if (!experiences || experiences.length === 0) return '';
    return experiences.map(e => e.description).join(' ');
  }
  saveResume(): void {
    Swal.fire({
      title: 'Save your resume',
      input: 'text',
      inputLabel: 'Enter a friendly name',
      inputPlaceholder: 'e.g., Your_Resume_V1',
      inputAttributes: { autocapitalize: 'off' },
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      showLoaderOnConfirm: true,
      preConfirm: (name) => {
        if (!name || !name.trim()) {
          Swal.showValidationMessage('Please enter a name');
          return false;
        }
        return name.trim();
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then(result => {
      if (!result.isConfirmed) return;

      const resumeName = result.value as string;

      // build payload
      const payload = {
        resumeName,
        id:this.resumeId,
        userId: this.userId,              // set in loadCurrentUser()
        personal: this.resumeData.personalInfo,
        experience: this.resumeData.experience,
        education: this.resumeData.education,
        skills: this.resumeData.skills,
        projects: this.resumeData.projects,
        certifications: this.resumeData.certifications,
        languages: this.resumeData.languages
      };

      this.isSaving = true;
      
      // Create complete resume object with all fields
      const completeResumeData = {
        personalInfo: {
          fullName: this.resumeData.personalInfo.fullName,
          email: this.resumeData.personalInfo.email,
          phone: this.resumeData.personalInfo.phone,
          location: this.resumeData.personalInfo.location,
          linkedIn: this.resumeData.personalInfo.linkedIn,
          portfolio: this.resumeData.personalInfo.portfolio,
          summary: this.resumeData.personalInfo.summary
        },
        experience: this.resumeData.experience,
        education: this.resumeData.education,
        skills: this.resumeData.skills,
        projects: this.resumeData.projects,
        certifications: this.resumeData.certifications,
        languages: this.resumeData.languages
      };
      
      // ALWAYS save to localStorage first (before backend call)
      console.log('=== RESUME TOOL: Saving to localStorage ===');
      console.log('Resume Data:', completeResumeData);
      localStorage.setItem('userResume', JSON.stringify(completeResumeData));
      sessionStorage.setItem('currentResume', JSON.stringify(completeResumeData));
      
      const resumeMetadata = {
        id: 'current-resume',
        name: resumeName,
        lastUpdated: new Date().toISOString(),
        isPrimary: true
      };
      console.log('Resume Metadata:', resumeMetadata);
      localStorage.setItem('currentResumeMetadata', JSON.stringify(resumeMetadata));
      
      // Then save to backend
      this.http.post(`${environment.apiBaseUrl}/api/resumes`, payload).subscribe({
        next: () => {
          this.isSaving = false;
          console.log('✓ Resume saved to backend and localStorage successfully');
          
          Swal.fire({
            icon: 'success',
            title: 'Saved!',
            text: `Your resume "${resumeName}" has been saved successfully.`,
            confirmButtonColor: '#3085d6'
          });
        },
        error: (err) => {
          console.error('Backend save error:', err);
          this.isSaving = false;
          
          // localStorage already saved, so just warn about backend
          Swal.fire({
            icon: 'warning',
            title: 'Partially Saved',
            text: `Resume saved locally. Backend sync had an issue, but your data is safe.`,
          });
        }
      });
    });
  }
  loadResume(): void {
    // Implementation for loading saved resume data
    const saved = localStorage.getItem('resumeData');
    if (saved) {
      this.resumeData = JSON.parse(saved);
    }
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

}
