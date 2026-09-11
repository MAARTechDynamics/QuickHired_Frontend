import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-faq',
  standalone: true, 
  imports: [HttpClientModule, RouterModule, CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent {
 faqCategoriesChunks: any[][] = [];
 searchQuery: string = '';
 selectedCategory: string = 'all';
 filteredCount: number = 0;

 constructor() {
    this.faqCategoriesChunks = this.chunkArray(this.faqCategories, 2);
    this.updateFilteredCount();
  }

  faqCategories = [
    {
      category: 'General',
      questions: [
        {
          question: 'What is Quick Hired?',
          answer: `Quick Hired is an AI-powered interview assistant that helps job seekers practice and prepare for interviews with real-time AI-generated questions, feedback, and performance analytics.`,
          expanded: false
        },
        {
          question: 'Who can use Quick Hired?',
          answer: `Anyone preparing for job interviews, including fresh graduates, experienced professionals, and career switchers can benefit from Quick Hired's AI interview practice sessions.`,
          expanded: false
        },
        {
          question: 'How accurate are the AI-generated interview questions?',
          answer: `Quick Hired uses advanced natural language processing and machine learning models trained on industry-specific datasets to generate realistic and relevant interview questions.`,
          expanded: false
        },
        {
          question: 'Can I customize my interview sessions?',
          answer: `Yes, users can select job roles, industries, and difficulty levels to customize their mock interview sessions according to their career goals.`,
          expanded: false
        },
        {
          question: 'Is Quick Hired suitable for technical interviews?',
          answer: `Absolutely! Quick Hired supports both behavioral and technical interview preparation across multiple domains like software development, data science, marketing, finance, and more.`,
          expanded: false
        }
      ]
    },

    {
      category: 'Pricing & Subscription',
      questions: [
      {
          question: 'Is there a free trial available?',
          answer: `Quick Hired offers a free plan with limited features. You can practice basic interviews, but access to advanced AI feedback, analytics, and role-specific questions requires a standard and pro subscription.`,
          expanded: false
      },

        {
          question: 'What are the subscription plans?',
          answer: `Quick Hired offers monthly and annual subscription plans. The annual plan provides a discounted price compared to the monthly plan.`,
          expanded: false
        },
        {
          question: 'Can I cancel my subscription anytime?',
          answer: `Yes, you can cancel your subscription at any time from your account settings. Your subscription will remain active until the end of the billing period.`,
          expanded: false
        },
        {
          question: 'Do you offer refunds?',
          answer: `We offer refunds in cases where the user faces technical issues or accidental charges. Please contact support for assistance.`,
          expanded: false
        }
      ]
    },

    {
      category: 'AI & Data Privacy',
      questions: [
        {
          question: 'Is my interview data stored securely?',
          answer: `Yes, all user data is encrypted and securely stored in compliance with industry standards and data protection regulations.`,
          expanded: false
        },
        {
          question: 'Does Quick Hired share my data with third parties?',
          answer: `No, Quick Hired does not sell or share your personal data with any third-party advertisers or external platforms.`,
          expanded: false
        },
        {
          question: 'How does the AI evaluate my answers?',
          answer: `The AI evaluates your responses based on clarity, relevance, confidence, and domain knowledge using advanced machine learning models.`,
          expanded: false
        },
        {
          question: 'Can I delete my data anytime?',
          answer: `Yes, you have full control over your data. You can request data deletion from your profile settings anytime.`,
          expanded: false
        },
        {
          question: 'Is Quick Hired GDPR compliant?',
          answer: `Yes, Quick Hired is fully compliant with GDPR and other global data privacy regulations to ensure your information stays protected.`,
          expanded: false
        }
      ]
    }
  ];
  
  chunkArray(arr: any[], size: number): any[][] {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  toggleQuestion(q: any, category: any): void {
    if (q.expanded) {
      q.expanded = false;
    } else {
      category.questions.forEach((item: any) => item.expanded = false);
      q.expanded = true;
    }
  }

  onSearch(): void {
    // Close all expanded questions when searching
    this.faqCategories.forEach(category => {
      category.questions.forEach((q: any) => q.expanded = false);
    });
    this.updateFilteredCount();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.updateFilteredCount();
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.searchQuery = '';
    // Close all expanded questions when changing category
    this.faqCategories.forEach(cat => {
      cat.questions.forEach((q: any) => q.expanded = false);
    });
    this.updateFilteredCount();
  }

  getFilteredCategories(): any[] {
    let filtered = this.faqCategories;

    // Filter by selected category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(cat => cat.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      filtered = filtered.map(category => {
        const matchingQuestions = category.questions.filter((q: any) => 
          q.question.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
        
        if (matchingQuestions.length > 0) {
          return { ...category, questions: matchingQuestions };
        }
        return null;
      }).filter(cat => cat !== null);
    }

    return filtered;
  }

  getVisibleQuestions(category: any): any[] {
    if (!this.searchQuery.trim()) {
      return category.questions;
    }

    return category.questions.filter((q: any) => 
      q.question.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  updateFilteredCount(): void {
    const filtered = this.getFilteredCategories();
    this.filteredCount = filtered.reduce((count, category) => {
      return count + this.getVisibleQuestions(category).length;
    }, 0);
  }

  getCategoryName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'General': 'faq.category.general',
      'Pricing & Subscription': 'faq.category.pricing',
      'AI & Data Privacy': 'faq.category.privacy',
      'Technical Support': 'faq.category.technical',
      'Account Management': 'faq.category.account',
      'Interviews': 'faq.category.interviews'
    };
    return categoryMap[category] || 'faq.category.general';
  }

}
