import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../environments/environment';

declare var $: any;
@Component({
  selector: 'app-interview-questions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule,FormsModule],
  templateUrl: './interview-questions.component.html',
  styleUrl: './interview-questions.component.css'
})
export class InterviewQuestionsComponent {
  companies = ['IBM', 'Google', 'Amazon', 'Microsoft','Apple','Tesla','Netflix'];
  roles = [
    'Software Engineer',
    'Sales Advisor',
    'Product Manager',
    'UI/UX Designer',
    'Data Analyst',
    'HR Manager',
    'Marketing Specialist',
    'Business Analyst',
    'DevOps Engineer',
    'Customer Support Representative',
    'Quality Assurance Engineer',
    'Technical Writer',
    'Finance Manager',
    'IT Support Specialist',
    'Machine Learning Engineer'
  ];
  
  // selectedCompany = '';
  // selectedRole = '';
  questions: any[] = [];
  loading = false;
  selectedAnswer: string | null = null; 
  noQuestionsFound = false;
  manualCompany: string = '';
  manualRole: string = '';
  visibleQuestionsCount = 3; 
  selectedCompany: string = 'Mostly Asked';  
  selectedRole: string = 'General'; 
  genericQuestions: any[] = [
  { question: 'Tell me about yourself.', answer: null, loading: false, expanded: false },
  { question: 'What are your strengths and weaknesses?', answer: null, loading: false, expanded: false },
  { question: 'Why do you want to work here?', answer: null, loading: false, expanded: false },
  { question: 'Tell me about a challenge you faced and how you handled it.', answer: null, loading: false, expanded: false },
  { question: 'Where do you see yourself in 5 years?', answer: null, loading: false, expanded: false },
  { question: 'Why should we hire you?', answer: null, loading: false, expanded: false },
  { question: 'Describe a time you worked in a team.', answer: null, loading: false, expanded: false },
  { question: 'What do you know about our company?', answer: null, loading: false, expanded: false },
  { question: 'Do you prefer working independently or on a team?', answer: null, loading: false, expanded: false },
  { question: 'How do you handle pressure and stress?', answer: null, loading: false, expanded: false },

  { question: 'Describe your ideal work environment.', answer: null, loading: false, expanded: false },
  { question: 'How do you prioritize your tasks when you have multiple deadlines?', answer: null, loading: false, expanded: false },
  { question: 'What motivates you to perform well at work?', answer: null, loading: false, expanded: false },
  { question: 'How do you deal with criticism?', answer: null, loading: false, expanded: false },
  { question: 'What are your long-term career goals?', answer: null, loading: false, expanded: false },
  { question: 'Tell me about a time you disagreed with your manager and how you handled it.', answer: null, loading: false, expanded: false },
  { question: 'What accomplishment are you most proud of?', answer: null, loading: false, expanded: false },
  { question: 'What are your salary expectations?', answer: null, loading: false, expanded: false },
  { question: 'What are you passionate about?', answer: null, loading: false, expanded: false },
  { question: 'How do you stay organized?', answer: null, loading: false, expanded: false },

  { question: 'How do you handle tight deadlines?', answer: null, loading: false, expanded: false },
  { question: 'Describe a time you took initiative on a project.', answer: null, loading: false, expanded: false },
  { question: 'How do you handle failure?', answer: null, loading: false, expanded: false },
  { question: 'What makes you unique?', answer: null, loading: false, expanded: false },
  { question: 'How do you handle conflict with coworkers?', answer: null, loading: false, expanded: false },
  { question: 'Describe a time when you had to learn something quickly.', answer: null, loading: false, expanded: false },
  { question: 'What are your hobbies outside of work?', answer: null, loading: false, expanded: false },
  { question: 'How do you handle repetitive tasks?', answer: null, loading: false, expanded: false },
  { question: 'Tell me about a time you improved a process.', answer: null, loading: false, expanded: false },
  { question: 'What kind of manager do you work best with?', answer: null, loading: false, expanded: false },

  { question: 'Describe a time you had to handle multiple responsibilities.', answer: null, loading: false, expanded: false },
  { question: 'What does success mean to you?', answer: null, loading: false, expanded: false },
  { question: 'How do you ensure quality in your work?', answer: null, loading: false, expanded: false },
  { question: 'How do you stay motivated during difficult projects?', answer: null, loading: false, expanded: false },
  { question: 'How do you handle feedback from a colleague?', answer: null, loading: false, expanded: false },
  { question: 'Describe a situation where you exceeded expectations.', answer: null, loading: false, expanded: false },
  { question: 'Tell me about a time you made a mistake and how you fixed it.', answer: null, loading: false, expanded: false },
  { question: 'How do you adapt to changes at work?', answer: null, loading: false, expanded: false },
  { question: 'What are the most important values you look for in a company?', answer: null, loading: false, expanded: false },
  { question: 'How do you keep your technical or professional skills updated?', answer: null, loading: false, expanded: false },

  { question: 'What role do you usually take in a team?', answer: null, loading: false, expanded: false },
  { question: 'Describe a time you successfully managed a conflict.', answer: null, loading: false, expanded: false },
  { question: 'How do you handle a situation where you disagree with a client?', answer: null, loading: false, expanded: false },
  { question: 'What’s your biggest professional failure?', answer: null, loading: false, expanded: false },
  { question: 'How do you stay productive when working remotely?', answer: null, loading: false, expanded: false },
  { question: 'Tell me about a time you had to persuade someone to see things your way.', answer: null, loading: false, expanded: false },
  { question: 'What steps do you take to ensure effective communication in a team?', answer: null, loading: false, expanded: false },
  { question: 'What do you enjoy most about your current or last job?', answer: null, loading: false, expanded: false },
  { question: 'If you could change one thing about your last job, what would it be?', answer: null, loading: false, expanded: false },
  { question: 'Do you have any questions for us?', answer: null, loading: false, expanded: false }
];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    this.questions = [...this.genericQuestions]; 
  }

ngAfterViewInit() {
  setTimeout(() => {
    $('#companySelect').select2({
      minimumResultsForSearch: -1,
      width: '100%'
    }).on('change', (e: any) => {
      this.selectedCompany = e.target.value;
    });

    $('#roleSelect').select2({
      minimumResultsForSearch: -1,
      width: '100%'
    }).on('change', (e: any) => {
      this.selectedRole = e.target.value;
    });
  });
}
onManualCompanyInput() {
  if (this.manualCompany.trim()) {
    this.selectedCompany = this.manualCompany.trim();
  }
}

onManualRoleInput() {
  if (this.manualRole.trim()) {
    this.selectedRole = this.manualRole.trim();
  }
}
toggleQuestion(q: any): void {
  // Check if the question is already expanded
  const isAlreadyExpanded = q.expanded;

  // Collapse all questions
  this.questions.forEach(item => item.expanded = false);

  // Only expand if it wasn't already expanded
  if (!isAlreadyExpanded) {
    q.expanded = true;

    // Load answer if needed
    if (!q.answer && !q.loading) {
      this.askAI(q);
    }
  }
}
formatAnswer(raw: string): string {
  if (!raw) return '';

  // 1. Normalize <br> and newlines
  let formatted = raw.replace(/<br\s*\/?>/gi, '\n');
  formatted = formatted.replace(/\r\n|\r/g, '\n');

  // 2. Split into lines
  const lines = formatted.split('\n').map(line => line.trim()).filter(l => l.length > 0);

  let finalHtml = '';
  let inList = false;

  for (let line of lines) {
    
    if (/^-{3,}$/.test(line)) {
      continue;
    }

    // Apply bold formatting (**text** → <b>text</b>)
    line = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    if (/^-\s+/.test(line)) {
      // Bullet point (only when single dash followed by space)
      if (!inList) {
        finalHtml += '<ul>';
        inList = true;
      }
      finalHtml += `<li>${line.substring(1).trim()}</li>`;
    } else {
      // Normal text
      if (inList) {
        finalHtml += '</ul>'; // close list before normal text
        inList = false;
      }
      finalHtml += `<p>${line}</p>`;
    }
  }

  if (inList) {
    finalHtml += '</ul>'; // close list if still open
  }

  return finalHtml.trim();
}

loadQuestions() {
  this.loading = true;
  this.selectedAnswer = null;
  this.questions = [];
  this.noQuestionsFound = false;
  this.visibleQuestionsCount = 3; // reset visible questions count every time

  this.http.get<string[]>(`${environment.apiBaseUrl}/api/AIInterview/questions?company=${this.selectedCompany}&role=${this.selectedRole}`)
    .subscribe({
      next: (res) => {
        if (res.length === 0) {
          this.noQuestionsFound = true;
        } else {
          this.questions = res.map(q => ({
            question: q,
            answer: null,
            loading: false,
            expanded: false   
          }));
          
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.noQuestionsFound = true;
      }
    });
}
showMoreQuestions() {
  this.visibleQuestionsCount += 3; 
}
onImageError(event: any) {
  event.target.src = 'assets/logos/blank.png';
}
// loadQuestions() {
//   this.loading = true;
//   this.selectedAnswer = null;
//   this.questions = [];
//   this.noQuestionsFound = false;

//   this.http.get<string[]>(`https://localhost:44303/api/AIInterview/questions?company=${this.selectedCompany}&role=${this.selectedRole}`)
//     .subscribe({
//       next: (res) => {
//         if (res.length === 0) {
//           this.noQuestionsFound = true;
//         } else {
//           this.questions = res.map(q => ({ question: q, answer: null, loading: false }));
//         }
//         this.loading = false;
//       },
//       error: () => {
//         this.loading = false;
//         this.noQuestionsFound = true;
//       }
//     });
// }
 
askAI(q: any) {
  q.loading = true;
  this.selectedAnswer = null; 

  this.http.post<any>(`${environment.apiBaseUrl}/api/AIInterview/simple-ask`, { question: q.question })
    .subscribe({
      next: (res) => {
        q.answer = res.answer;
        q.loading = false;
        this.selectedAnswer = res.answer; 
      },
      error: (err) => {
        q.loading = false;
        console.error('AI Request Failed:', err);
        q.answer = "Failed to fetch answer. Please try again later.";
      }
    });
}
  
  // askAI(q: any) {
  //   q.loading = true;
  //   this.http.post<any>(`https://localhost:44303/api/AIInterview/simple-ask`, { question: q.question})
  //     .subscribe({
  //       next: (res) => {
  //         q.answer = res.answer;
  //         q.loading = false;
  //       },
  //       error: () => q.loading = false
  //     });
  // }
}


