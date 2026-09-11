import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

import { LoginComponent } from './login/login.component';
import { RegisterComponent} from './register/register.component';
import { LoginLayoutComponent } from './shared/login-layout/login-layout.component';
import { MainLayoutComponent } from './shared/main-layout/main-layout.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { PricingComponent } from './pricing/pricing.component';
import { InterviewComponent } from './interview/interview.component';
import { MultiStepInterviewComponent } from './multi-step-interview/multi-step-interview.component';
import { SessionExpiredComponent } from './session-expired/session-expired.component';
import { MockInterviewComponent } from './mock-interview/mock-interview.component';
import { MultiStepMockInterviewComponent } from './multi-step-mock-interview/multi-step-mock-interview.component';
import { InterviewQuestionsComponent } from './interview-questions/interview-questions.component';
import { RecordMeetingsComponent } from './record-meetings/record-meetings.component';
import { InterviewReportsComponent } from './interview-reports/interview-reports.component';
import { RecordedMeetingsComponent } from './recorded-meetings/recorded-meetings.component';
import { AccountSettingComponent } from './account-setting/account-setting.component';
import { MembershipComponent } from './membership/membership.component';
import { PaymentComponent } from './payment/payment.component';
import { SubscriptionCallbackComponent } from './subscription-callback/subscription-callback.component';
import { SuperAdminLayoutComponent } from './shared/super-admin-layout/super-admin-layout.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { superAdminGuard } from './guards/super-admin.guard';
import { SuperAdminRegisterComponent } from './super-admin-register/super-admin-register.component';
import { UsersComponent } from './users/users.component';
import { ReportComponent } from './report/report.component';
import { PromoCodesComponent } from './promo-codes/promo-codes.component';
import { SuperAdminAccountSettingComponent } from './super-admin-account-setting/super-admin-account-setting.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { FaqComponent } from './faq/faq.component';
import { InterviewHomeComponent } from './interview-home/interview-home.component';
import { CodingCopilotComponent } from './coding-copilot/coding-copilot.component';
import { MockHomeComponent } from './mock-home/mock-home.component';
import { PricingHomeComponent } from './pricing-home/pricing-home.component';
import { OnlineAssessmentCopilotComponent } from './online-assessment-copilot/online-assessment-copilot.component';
import { HireVueInterviewComponent } from './hirevue-interview/hirevue-interview.component';
import { QuestionBankHomeComponent } from './question-bank-home/question-bank-home.component';
import { ResumeBuilderomponent } from './resume-builder/resume-builder.component';
import { AICoverLetterComponent } from './ai-cover-letter/ai-cover-letter.component';
import { AIThankYouEmailComponent } from './ai-thank-you-email/ai-thank-you-email.component';
import { AIFollowUpEmailComponent } from './ai-follow-up-email/ai-follow-up-email.component';
import { AIColdOutReachEmailComponent } from './ai-cold-out-reach-email/ai-cold-out-reach-email.component';
import { AHelpCenterComponent } from './a-help-center/a-help-center.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { ContacttUsComponent } from './contact-us/contact-us.component';
import { ResumeToolComponent } from './resume-tool/resume-tool.component';
import { ResumeListComponent } from './resume-list/resume-list.component';
import { FreeToolsComponent } from './free-tools/free-tools.component';
import { JobFinderComponent } from './job-finder/job-finder.component';
import { authGuard } from './guards/auth.guard';



export const routes: Routes = [
    {
      path: '',  // Default route (Login page)
      component: LoginLayoutComponent,
      children: [
        { path: '', component: HomeComponent },  // Default Login Page
        { path: 'login', component:LoginComponent},

        { path: 'register', component: RegisterComponent },
        { path: 'super-admin-register', component: SuperAdminRegisterComponent },
        { path: 'verify-email', component: VerifyEmailComponent },
        { path: 'interview', component: InterviewComponent, canActivate: [authGuard]},
        { path: 'mock-interview', component:MockInterviewComponent, canActivate: [authGuard]},
        { path: 'forgot-password', component:ForgotPasswordComponent},
        { path: 'reset-password', component:ResetPasswordComponent},
        { path: 'home', component:HomeComponent},
        { path: 'interview-home', component:InterviewHomeComponent},
        { path: 'mock-home', component:MockHomeComponent},
        { path: 'pricing-home', component: PricingComponent },
        { path: 'coding-copilot', component:CodingCopilotComponent},
        { path: 'online-assessment-copilot', component:OnlineAssessmentCopilotComponent},
        { path: 'hirevuew-interview', component:HireVueInterviewComponent},
        { path: 'question-bank-home', component:QuestionBankHomeComponent},
        { path: 'resume-builder', component:ResumeBuilderomponent},
        { path: 'ai-cover-letter', component:AICoverLetterComponent},
        { path: 'ai-thank-you-email', component:AIThankYouEmailComponent},
        { path: 'ai-follow-up-email', component:AIFollowUpEmailComponent},
        { path: 'about-us', component:AboutUsComponent},
        { path: 'ai-cold-out-reach-email', component:AIColdOutReachEmailComponent},
        { path: 'a-help-center', component:AHelpCenterComponent},
        { path: 'contact-us',component:ContacttUsComponent},
        { path: 'resume', component: ResumeToolComponent, canActivate: [authGuard]},
        { path: 'career-tools', component:FreeToolsComponent, canActivate: [authGuard]},
        { path: 'job-finder', component: JobFinderComponent, canActivate: [authGuard]}
       
        
       
        
      ],
    },
    {
      path: '',  // Main layout 
      component: MainLayoutComponent,
      canActivate: [authGuard],
      children: [
       
        { path: 'pricing', component: PricingComponent},
        // { path: 'interview', component: InterviewComponent},
        { path: 'multi-step-interview', component:MultiStepInterviewComponent},
        { path: 'session-expired', component:SessionExpiredComponent},
        // { path: 'mock-interview', component:MockInterviewComponent},
        { path: 'multi-step-mock-interview', component:MultiStepMockInterviewComponent},
        { path: 'interview-questions', component:InterviewQuestionsComponent},
        { path: 'record-meetings', component:RecordMeetingsComponent},
        { path: 'interview-reports', component:InterviewReportsComponent},
        { path: 'recorded-meetings', component:RecordedMeetingsComponent},
        { path: 'account-setting', component:AccountSettingComponent},
        { path: 'payment', component:PaymentComponent},
        { path: 'subscription-callback', component:SubscriptionCallbackComponent},
        { path: 'membership', component:MembershipComponent},
        { path: 'faq', component:FaqComponent},
        { path: 'resume-list', component: ResumeListComponent},
   
       
      ],
    },
   {
    path: '',
    component: SuperAdminLayoutComponent,
    children: [
      { path: 'subscriptions', component: SubscriptionsComponent,canActivate: [superAdminGuard]  },
      { path: 'users', component: UsersComponent,canActivate: [superAdminGuard] },
      { path: 'super-admin-account-setting', component:SuperAdminAccountSettingComponent,canActivate: [superAdminGuard]},
      { path: 'report', component:ReportComponent,canActivate: [superAdminGuard]},
      { path: 'promo-codes', component:PromoCodesComponent,canActivate: [superAdminGuard]}

    ]
  },


    { path: '**', redirectTo: '' },  // 404 redirect to login
  ];