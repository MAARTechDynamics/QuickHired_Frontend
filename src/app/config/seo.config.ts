export interface PageSeoConfig {
  title: string;
  description: string;
  keywords: string[];
  canonicalPath: string;
  ogType?: string;
  ogImage?: string;
  robots?: string;
  faqs?: Array<{ question: string; answer: string }>;
}

export const SEO_CONFIG: Record<string, PageSeoConfig> = {
  home: {
    title: 'QuickHired - AI Interview Copilot | Real-Time Interview Assistance',
    description: 'Master every interview with QuickHired\'s AI-powered copilot. Get real-time assistance for coding challenges, behavioral rounds, and technical interviews across 50+ platforms.',
    keywords: ['ai interview copilot', 'interview preparation', 'coding interview help', 'mock interview', 'real-time interview assistance'],
    canonicalPath: '',
    ogType: 'website',
    ogImage: '/assets/media/og-home.jpg'
  },
  pricing: {
    title: 'Pricing Plans - QuickHired AI Interview Copilot',
    description: 'Choose the right plan for your interview preparation. Free plan available with 2 AI sessions. Standard at $29/mo and Pro at $49/mo with unlimited features.',
    keywords: ['interview copilot pricing', 'ai interview cost', 'interview prep subscription', 'mock interview pricing'],
    canonicalPath: 'pricing',
    ogType: 'website'
  },
  login: {
    title: 'Login - QuickHired AI Interview Copilot',
    description: 'Sign in to QuickHired to access your AI interview preparation dashboard and continue practicing for your next interview.',
    keywords: ['login', 'sign in', 'interview copilot login'],
    canonicalPath: 'login',
    ogType: 'website',
    robots: 'noindex, nofollow'
  },
  register: {
    title: 'Sign Up - QuickHired AI Interview Copilot',
    description: 'Create your free QuickHired account and start preparing for interviews with AI-powered assistance. No credit card required.',
    keywords: ['sign up', 'register', 'create account', 'interview copilot registration'],
    canonicalPath: 'register',
    ogType: 'website',
    robots: 'noindex, nofollow'
  },
  'reset-password': {
    title: 'Reset Password - QuickHired',
    description: 'Reset your QuickHired account password.',
    keywords: ['reset password', 'forgot password'],
    canonicalPath: 'reset-password',
    ogType: 'website',
    robots: 'noindex, nofollow'
  },
  'verify-email': {
    title: 'Verify Email - QuickHired',
    description: 'Verify your email address to activate your QuickHired account.',
    keywords: ['verify email', 'email verification'],
    canonicalPath: 'verify-email',
    ogType: 'website',
    robots: 'noindex, nofollow'
  },
  'about-us': {
    title: 'About Us - QuickHired AI Interview Copilot',
    description: 'Learn about QuickHired\'s mission to help job seekers ace their interviews with AI-powered real-time assistance and comprehensive preparation tools.',
    keywords: ['about quickhired', 'interview copilot company', 'ai interview platform'],
    canonicalPath: 'about-us',
    ogType: 'website'
  },
  'contact-us': {
    title: 'Contact Us - QuickHired Support',
    description: 'Get in touch with QuickHired support team. We\'re here to help you succeed in your interview preparation journey.',
    keywords: ['contact support', 'quickhired help', 'interview copilot support'],
    canonicalPath: 'contact-us',
    ogType: 'website'
  },
  faq: {
    title: 'FAQ - QuickHired AI Interview Copilot',
    description: 'Find answers to frequently asked questions about QuickHired\'s AI interview copilot, features, pricing, and how to prepare for interviews.',
    keywords: ['interview copilot faq', 'ai interview questions', 'quickhired help'],
    canonicalPath: 'faq',
    ogType: 'website',
    faqs: [
      {
        question: 'What is QuickHired?',
        answer: 'QuickHired is an AI-powered interview copilot that provides real-time assistance during coding, behavioral, and technical interviews.'
      },
      {
        question: 'How does the AI interview copilot work?',
        answer: 'Our AI analyzes interview questions in real-time and provides contextual suggestions, code solutions, and behavioral response frameworks to help you succeed.'
      },
      {
        question: 'Is QuickHired detectable during interviews?',
        answer: 'QuickHired operates discreetly on your device. We recommend using it responsibly and in accordance with interview guidelines.'
      },
      {
        question: 'What platforms does QuickHired support?',
        answer: 'QuickHired works with 50+ platforms including HireVue, HackerRank, CodeSignal, and other major interview platforms.'
      },
      {
        question: 'What\'s included in the free plan?',
        answer: 'The free plan includes 2 AI interview sessions, access to resume builder, cover letter generator, and limited question bank access.'
      }
    ]
  },
  'free-tools': {
    title: 'Free Career Tools - Resume Builder, Cover Letter & More',
    description: 'Access free AI-powered career tools including resume builder, cover letter generator, thank-you email templates, and recruiter outreach assistance.',
    keywords: ['free resume builder', 'ai cover letter', 'career tools', 'interview preparation tools'],
    canonicalPath: 'free-tools',
    ogType: 'website'
  },
  'resume-builder': {
    title: 'AI Resume Builder - Create ATS-Optimized Resumes Free',
    description: 'Build professional, ATS-optimized resumes with AI assistance. Get real-time suggestions for content, formatting, and keyword optimization.',
    keywords: ['ai resume builder', 'ats resume', 'free resume builder', 'professional resume'],
    canonicalPath: 'resume-builder',
    ogType: 'website'
  },
  'ai-cover-letter': {
    title: 'AI Cover Letter Generator - Tailored Cover Letters',
    description: 'Generate personalized cover letters that align with job descriptions. Highlight relevant experience and show genuine interest in the role.',
    keywords: ['ai cover letter', 'cover letter generator', 'job application letter'],
    canonicalPath: 'ai-cover-letter',
    ogType: 'website'
  },
  'coding-copilot': {
    title: 'Coding Interview Copilot - Real-Time Algorithm Help',
    description: 'Get real-time coding interview assistance with detailed explanations, optimization tips, and best practices for all major programming languages.',
    keywords: ['coding interview help', 'algorithm copilot', 'programming interview', 'leetcode help'],
    canonicalPath: 'coding-copilot',
    ogType: 'website'
  },
  'online-assessment-copilot': {
    title: 'Online Assessment Copilot - MCQ & Logic Test Help',
    description: 'Auto-detect MCQs, logic puzzles, and timed quizzes. Get instant answers with detailed reasoning for aptitude and technical screenings.',
    keywords: ['online assessment help', 'mcq solver', 'aptitude test copilot', 'logic puzzle help'],
    canonicalPath: 'online-assessment-copilot',
    ogType: 'website'
  },
  'hirevue-interview': {
    title: 'HireVue Interview Practice - AI Video Interview Prep',
    description: 'Practice video interviews with AI-powered feedback on content, delivery, and body language. Improve your presentation skills.',
    keywords: ['hirevue practice', 'video interview prep', 'ai interview feedback'],
    canonicalPath: 'hirevue-interview',
    ogType: 'website'
  },
  'interview-questions': {
    title: 'Interview Question Bank - Company-Specific Questions',
    description: 'Access thousands of curated interview questions from top companies like Google, Amazon, Microsoft, and Meta. Organized by role and difficulty.',
    keywords: ['interview questions', 'google interview', 'amazon interview', 'company interview questions'],
    canonicalPath: 'interview-questions',
    ogType: 'website'
  }
};
