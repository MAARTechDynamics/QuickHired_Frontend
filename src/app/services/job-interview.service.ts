import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  jobType: string;
  postedDate: string;
  applicants?: number;
  matchScore?: number;
  source: 'jooble';
  url: string;
  requirements?: string[];
  skills?: string[];
}

export interface JobMatch {
  job: JobListing;
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
}

export interface AutoApplyConfig {
  enabled: boolean;
  jobsPerDay: number;
  minMatchScore: number;
  excludeCompanies?: string[];
  preferredLocations?: string[];
  preferredJobTypes?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class JobIntegrationService {
  private apiUrl = `${environment.apiBaseUrl}/api/jobintegration`;
  private jobsSubject = new BehaviorSubject<JobListing[]>([]);
  private matchesSubject = new BehaviorSubject<JobMatch[]>([]);
  private autoApplyConfigSubject = new BehaviorSubject<AutoApplyConfig>({
    enabled: false,
    jobsPerDay: 5,
    minMatchScore: 70
  });

  public jobs$ = this.jobsSubject.asObservable();
  public matches$ = this.matchesSubject.asObservable();
  public autoApplyConfig$ = this.autoApplyConfigSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Search jobs across multiple platforms
   */
  searchJobs(
    keywords: string,
    location: string,
    jobType?: string,
    salaryMin?: number,
    salaryMax?: number
  ): Observable<JobListing[]> {
    const params = {
      keywords,
      location,
      ...(jobType && { jobType }),
      ...(salaryMin && { salaryMin }),
      ...(salaryMax && { salaryMax })
    };

    return this.http.get<JobListing[]>(`${this.apiUrl}/search-jobs`, { params }).pipe(
      map(jobs => {
        this.jobsSubject.next(jobs);
        return jobs;
      })
    );
  }

  /**
   * Match resume against jobs
   */
  matchResumeToJobs(resumeId: string, jobs: JobListing[]): Observable<JobMatch[]> {
    return this.http.post<JobMatch[]>(`${this.apiUrl}/match-resume`, {
      resumeId,
      jobs
    }).pipe(
      map(matches => {
        this.matchesSubject.next(matches);
        return matches;
      })
    );
  }

  /**
   * Get jobs related to user's profile
   */
  getRecommendedJobs(userId: string, limit: number = 20): Observable<JobListing[]> {
    return this.http.get<JobListing[]>(`${this.apiUrl}/recommended-jobs/${userId}`, {
      params: { limit }
    }).pipe(
      map(jobs => {
        this.jobsSubject.next(jobs);
        return jobs;
      })
    );
  }

  /**
   * Customize resume for specific job
   */
  customizeResumeForJob(
    resumeId: string,
    jobId: string,
    jobDescription: string
  ): Observable<string> {
    return this.http.post<{ customizedResume: string }>(`${this.apiUrl}/customize-resume`, {
      resumeId,
      jobId,
      jobDescription
    }).pipe(
      map(response => response.customizedResume)
    );
  }

  /**
   * AI-powered resume customization
   */
  aiCustomizeResume(resumeData: any, jobListing: JobListing): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ai-customize-resume`, {
      resume: resumeData,
      job: jobListing
    });
  }

  /**
   * Get user's saved resumes
   */
  getUserResumes(): Observable<any[]> {
    const userId = localStorage.getItem('userId') || 'current-user';
    return this.http.get<any[]>(`${this.apiUrl}/user-resumes/${userId}`);
  }

  /**
   * Get resume by ID
   */
  getResumeById(resumeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/resume/${resumeId}`);
  }

  /**
   * Apply to job
   */
  applyToJob(
    userId: string,
    jobId: string,
    resumeId: string,
    coverLetterContent?: string
  ): Observable<{ success: boolean; message: string; applicationId?: string }> {
    return this.http.post<{ success: boolean; message: string; applicationId?: string }>(`${this.apiUrl}/apply-job`, {
      userId,
      jobId,
      resumeId,
      coverLetterContent
    });
  }

  /**
   * Get user's profile data for pre-filling forms
   */
  getUserProfile(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user-profile/${userId}`);
  }

  /**
   * Configure auto-apply settings
   */
  setAutoApplyConfig(config: AutoApplyConfig): Observable<any> {
    return this.http.post(`${this.apiUrl}/auto-apply-config`, config).pipe(
      map(response => {
        this.autoApplyConfigSubject.next(config);
        return response;
      })
    );
  }

  /**
   * Get auto-apply configuration
   */
  getAutoApplyConfig(userId: string): Observable<AutoApplyConfig> {
    return this.http.get<AutoApplyConfig>(`${this.apiUrl}/auto-apply-config/${userId}`).pipe(
      map(config => {
        this.autoApplyConfigSubject.next(config);
        return config;
      })
    );
  }

  /**
   * Start auto-apply service
   */
  startAutoApply(userId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/start-auto-apply`, { userId });
  }

  /**
   * Stop auto-apply service
   */
  stopAutoApply(userId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/stop-auto-apply`, { userId });
  }

  /**
   * Get auto-apply job history
   */
  getAutoApplyHistory(userId: string, limit: number = 50): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/auto-apply-history/${userId}`, {
      params: { limit }
    });
  }

  /**
   * Connect to job platform (OAuth)
   */
  connectJobPlatform(platform: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/connect-platform`, { platform, code });
  }

  /**
   * Get connected platforms
   */
  getConnectedPlatforms(userId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/connected-platforms/${userId}`);
  }
}
