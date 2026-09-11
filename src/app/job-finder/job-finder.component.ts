import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { JobIntegrationService, JobListing, JobMatch } from '../services/job-integration.service';
import { JobIntegrationService,JobMatch,JobListing } from '../services/job-interview.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// import { JobInterviewService } from '../services/job-interview.service';
import Swal from 'sweetalert2';

// interface JobListing {
//   id: string;
//   title: string;
//   company: string;
//   location: string;
//   jobType: string;
//   salary?: string;
//   description?: string;
//   requirements?: string[];
//   url?: string;
//   source?: string;
// }

// interface JobMatch {
//   matchPercentage: number;
//   job: JobListing;
//   matchedSkills: string[];
//   missingSkills: string[];
// }

@Component({
  selector: 'app-job-finder',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule,],
  template: `
    <div class="job-finder-container">
      <!-- Header -->
      <div class="job-finder-header">
        <h2 class="page-title">Smart Job Finder & Auto-Apply</h2>
        <p class="page-subtitle">Find jobs matching your resume and apply automatically</p>
      </div>

      <!-- Search Section -->
      <div class="search-section">
        <div class="search-form">
          <input
            type="text"
            class="search-input"
            placeholder="Job title, keywords..."
            [(ngModel)]="searchParams.keywords"
            (keyup.enter)="searchJobs()"
          />
          <input
            type="text"
            class="search-input"
            placeholder="Location"
            [(ngModel)]="searchParams.location"
            (keyup.enter)="searchJobs()"
          />
          <select class="search-select" [(ngModel)]="searchParams.jobType">
            <option value="">Job Type</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="remote">Remote</option>
          </select>
          <button class="btn-search" (click)="searchJobs()" [disabled]="isSearching">
            {{ isSearching ? 'Searching...' : 'Search Jobs' }}
          </button>
        </div>

        <!-- Platform Connections -->
        <div class="platforms-section">
          <h4>Connected Platforms</h4>
          <div class="platforms-list">
            <div class="platform-badge" *ngFor="let platform of connectedPlatforms">
              <span class="platform-name">{{ platform }}</span>
              <button class="btn-disconnect" (click)="disconnectPlatform(platform)">✕</button>
            </div>
            <button class="btn-connect" (click)="showPlatformConnect()">+ Connect Platform</button>
          </div>
        </div>
      </div>

      <!-- Auto-Apply Settings -->
      <div class="auto-apply-section">
        <div class="auto-apply-header">
          <h3>Auto-Apply Settings</h3>
          <div class="auto-apply-toggle">
            <label class="switch">
              <input type="checkbox" [(ngModel)]="autoApplyConfig.enabled" (change)="toggleAutoApply()">
              <span class="slider"></span>
            </label>
            <span class="toggle-label">{{ autoApplyConfig.enabled ? 'Enabled' : 'Disabled' }}</span>
          </div>
        </div>

        <div class="auto-apply-settings" *ngIf="autoApplyConfig.enabled">
          <div class="setting-group">
            <label>Jobs per Day</label>
            <input
              type="number"
              min="1"
              max="50"
              [(ngModel)]="autoApplyConfig.jobsPerDay"
              class="setting-input"
            />
          </div>
          <div class="setting-group">
            <label>Minimum Match Score (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              [(ngModel)]="autoApplyConfig.minMatchScore"
              class="setting-input"
            />
          </div>
          <button class="btn-save-config" (click)="saveAutoApplyConfig()">Save Settings</button>
          <div class="auto-apply-status" *ngIf="autoApplyStatus">
            <p>{{ autoApplyStatus }}</p>
          </div>
        </div>
      </div>

      <!-- Jobs Display Section -->
      <div class="jobs-section">
        <h3>Matched Jobs ({{ matchedJobs.length }})</h3>

        <div class="jobs-grid" *ngIf="matchedJobs.length > 0; else noJobs">
          <div class="job-card" *ngFor="let match of matchedJobs">
            <!-- Match Score -->
            <div class="match-score" [ngClass]="'score-' + (match.matchPercentage >= 80 ? 'high' : match.matchPercentage >= 60 ? 'medium' : 'low')">
              <span class="score-number">{{ match.matchPercentage }}%</span>
              <span class="score-label">Match</span>
            </div>

            <!-- Job Info -->
            <div class="job-info">
              <h4 class="job-title">{{ match.job.title }}</h4>
              <p class="job-company">{{ match.job.company }}</p>
              <p class="job-location">📍 {{ match.job.location }}</p>
              <p class="job-type" [ngClass]="'type-' + match.job.jobType.toLowerCase()">
                {{ match.job.jobType }}
              </p>
              <p class="job-salary" *ngIf="match.job.salary">💰 {{ match.job.salary }}</p>
            </div>

            <!-- Skills Match -->
            <div class="skills-match">
              <div class="matched-skills">
                <span class="skills-label">Matched Skills:</span>
                <div class="skills-tags">
                  <span class="skill-tag matched" *ngFor="let skill of match.matchedSkills | slice:0:3">
                    ✓ {{ skill }}
                  </span>
                </div>
              </div>
              <div class="missing-skills" *ngIf="match.missingSkills.length > 0">
                <span class="skills-label">Missing Skills:</span>
                <div class="skills-tags">
                  <span class="skill-tag missing" *ngFor="let skill of match.missingSkills | slice:0:2">
                    ✗ {{ skill }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="job-actions">
              <button class="btn-view" (click)="viewJobDetails(match.job)">View Job</button>
              <button class="btn-customize" (click)="customizeResume(match.job)">Customize Resume</button>
              <button class="btn-apply" (click)="applyToJob(match.job)">Apply Now</button>
            </div>
          </div>
        </div>

        <ng-template #noJobs>
          <div class="no-jobs">
            <p>{{ isSearching ? 'Searching for jobs...' : 'No jobs found. Try adjusting your search.' }}</p>
          </div>
        </ng-template>
      </div>

      <!-- Job Details Modal -->
      <div class="modal" *ngIf="selectedJob" (click)="closeJobDetails()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="closeJobDetails()">✕</button>
          <h3>{{ selectedJob.title }}</h3>
          <p class="modal-company">{{ selectedJob.company }}</p>
          <div class="modal-body">
            <p><strong>Location:</strong> {{ selectedJob.location }}</p>
            <p><strong>Job Type:</strong> {{ selectedJob.jobType }}</p>
            <p *ngIf="selectedJob.salary"><strong>Salary:</strong> {{ selectedJob.salary }}</p>
            <div class="job-description">
              <strong>Description:</strong>
              <p>{{ selectedJob.description }}</p>
            </div>
            <div class="job-requirements" *ngIf="selectedJob.requirements">
              <strong>Requirements:</strong>
              <ul>
                <li *ngFor="let req of selectedJob.requirements">{{ req }}</li>
              </ul>
            </div>
          </div>
          <div class="modal-actions">
            <a [href]="selectedJob.url" target="_blank" class="btn-external">View on {{ selectedJob.source }}</a>
            <button class="btn-apply" (click)="applyToJob(selectedJob)">Apply via QuickHired</button>
          </div>
        </div>
      </div>

      <!-- Resume Customization Modal -->
      <div class="modal" *ngIf="customizingJob" (click)="closeCustomizeResume()">
        <div class="modal-content modal-lg modal-customize" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="closeCustomizeResume()">✕</button>
          <h3>Customize Resume for {{ customizingJob.title }}</h3>
          
          <!-- Resume Selection -->
          <div class="resume-selection">
            <label>Select Resume to Customize:</label>
            <select class="resume-selector" [(ngModel)]="selectedResumeId" (change)="loadSelectedResume()">
              <option value="">-- Use Current Resume --</option>
              <option *ngFor="let resume of availableResumes" [value]="resume.id">
                {{ resume.name }} ({{ resume.lastUpdated | date:'short' }})
              </option>
            </select>
          </div>

          <!-- AI Customization Controls -->
          <div class="ai-customize-controls" *ngIf="userResume">
            <button class="btn-ai-customize" [disabled]="isCustomizing" (click)="aiCustomizeResume()">
              <span *ngIf="!isCustomizing">✨ Customize with AI</span>
              <span *ngIf="isCustomizing">Customizing...</span>
            </button>
            <p class="ai-note">AI will optimize your resume to match job requirements</p>
          </div>

          <div class="customize-container">
            <div class="customize-original">
              <h4>Your Resume</h4>
              <div class="resume-preview">
                <div *ngIf="userResume" class="resume-full">
                  <div class="resume-section" *ngIf="userResume.personalInfo">
                    <h5>{{ userResume.personalInfo.fullName }}</h5>
                    <p><strong>Email:</strong> {{ userResume.personalInfo.email }}</p>
                    <p><strong>Phone:</strong> {{ userResume.personalInfo.phone }}</p>
                    <p><strong>Location:</strong> {{ userResume.personalInfo.location }}</p>
                    <p *ngIf="userResume.personalInfo.summary" class="summary">{{ userResume.personalInfo.summary }}</p>
                  </div>
                  
                  <div class="resume-section" *ngIf="userResume.skills && userResume.skills.length > 0">
                    <h5>Skills</h5>
                    <div class="skills-list">
                      <span class="skill-badge" *ngFor="let skill of userResume.skills">{{ skill }}</span>
                    </div>
                  </div>
                  
                  <div class="resume-section" *ngIf="userResume.experience && userResume.experience.length > 0">
                    <h5>Experience</h5>
                    <div *ngFor="let exp of userResume.experience" class="exp-item">
                      <p class="exp-header"><strong>{{ exp.position }}</strong> at {{ exp.company }}</p>
                      <p class="exp-date">{{ exp.startDate }} - {{ exp.endDate || 'Present' }}</p>
                      <p>{{ exp.description }}</p>
                    </div>
                  </div>
                  
                  <div class="resume-section" *ngIf="userResume.education && userResume.education.length > 0">
                    <h5>Education</h5>
                    <div *ngFor="let edu of userResume.education" class="edu-item">
                      <p class="edu-header"><strong>{{ edu.degree }}</strong> in {{ edu.field }}</p>
                      <p class="edu-inst">{{ edu.institution }} ({{ edu.graduationDate }})</p>
                    </div>
                  </div>
                </div>
                <p *ngIf="!userResume" style="color: #999;">Loading your resume...</p>
              </div>
            </div>
            
            <div class="customize-sidebar">
              <h4>Job Requirements</h4>
              <div class="job-requirements-text">
                <p><strong>Position:</strong> {{ customizingJob.title }}</p>
                <p><strong>Company:</strong> {{ customizingJob.company }}</p>
                <p><strong>Location:</strong> {{ customizingJob.location }}</p>
                <p><strong>Job Type:</strong> {{ customizingJob.jobType }}</p>
                <p *ngIf="customizingJob.salary"><strong>Salary:</strong> {{ customizingJob.salary }}</p>
                <div class="description">
                  <p><strong>Description:</strong></p>
                  <p>{{ customizingJob.description }}</p>
                </div>
              </div>
            </div>
            
            <div class="customize-preview">
              <h4>Customized Resume Preview</h4>
              <div class="resume-preview" *ngIf="customizedResumePreview">
                <div [innerHTML]="customizedResumePreview"></div>
              </div>
              <div class="resume-preview" *ngIf="!customizedResumePreview" style="color: #999; font-style: italic;">
                <p>Click "Customize with AI" to generate an optimized resume based on job requirements</p>
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeCustomizeResume()">Cancel</button>
            <button class="btn-apply" [disabled]="!customizedResumePreview" (click)="applyWithCustomizedResume()">Apply with Customized Resume</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .job-finder-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .job-finder-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #091C43;
      margin-bottom: 10px;
    }

    .page-subtitle {
      font-size: 1.1rem;
      color: #666;
    }

    /* Search Section */
    .search-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .search-form {
      display: grid;
      grid-template-columns: 1fr 1fr 200px 120px;
      gap: 12px;
      margin-bottom: 20px;
    }

    .search-input,
    .search-select {
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95rem;
    }

    .search-input:focus,
    .search-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .btn-search {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 12px 24px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-search:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .btn-search:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Platforms */
    .platforms-section {
      border-top: 1px solid #eee;
      padding-top: 15px;
    }

    .platforms-section h4 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .platforms-list {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .platform-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f0f4f9;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .btn-disconnect {
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0;
    }

    .btn-disconnect:hover {
      color: #e74c3c;
    }

    .btn-connect {
      background: #f0f4f9;
      border: 1px dashed #3b82f6;
      color: #3b82f6;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .btn-connect:hover {
      background: #e3f2fd;
    }

    /* Auto-Apply Section */
    .auto-apply-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .auto-apply-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .auto-apply-header h3 {
      margin: 0;
      color: #091C43;
    }

    .auto-apply-toggle {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.4s;
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #3b82f6;
    }

    input:checked + .slider:before {
      transform: translateX(26px);
    }

    .toggle-label {
      font-size: 0.9rem;
      color: #666;
      font-weight: 600;
    }

    .auto-apply-settings {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .setting-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .setting-group label {
      font-weight: 600;
      color: #333;
      font-size: 0.9rem;
    }

    .setting-input {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .btn-save-config {
      background: #10b981;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-save-config:hover {
      background: #059669;
    }

    .auto-apply-status {
      padding: 10px;
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      border-radius: 4px;
      color: #065f46;
    }

    /* Jobs Section */
    .jobs-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .jobs-section h3 {
      margin-top: 0;
      color: #091C43;
    }

    .jobs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .job-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      position: relative;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .job-card:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      transform: translateY(-2px);
      border-color: #3b82f6;
    }

    .match-score {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
    }

    .score-high {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .score-medium {
      background: linear-gradient(135deg, #f59e0b, #d97706);
    }

    .score-low {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .score-number {
      font-size: 1.4rem;
      line-height: 1;
    }

    .score-label {
      font-size: 0.65rem;
      margin-top: 2px;
    }

    .job-info {
      flex: 1;
      margin-bottom: 15px;
    }

    .job-title {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      color: #1f2937;
      font-weight: 600;
      padding-right: 70px;
    }

    .job-company {
      margin: 0 0 4px 0;
      color: #3b82f6;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .job-location,
    .job-type,
    .job-salary {
      margin: 4px 0;
      color: #666;
      font-size: 0.9rem;
    }

    .job-type {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .type-full-time {
      background: #dbeafe;
      color: #1e40af;
    }

    .type-remote {
      background: #f0fdf4;
      color: #166534;
    }

    .type-contract {
      background: #fef3c7;
      color: #92400e;
    }

    .type-part-time {
      background: #fce7f3;
      color: #831843;
    }

    .skills-match {
      margin: 12px 0;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
    }

    .skills-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 6px;
    }

    .skills-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .skill-tag {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .skill-tag.matched {
      background: #ecfdf5;
      color: #065f46;
    }

    .skill-tag.missing {
      background: #fee2e2;
      color: #991b1b;
    }

    .job-actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
    }

    .btn-view,
    .btn-customize,
    .btn-apply {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .btn-view {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-view:hover {
      background: #e5e7eb;
    }

    .btn-customize {
      background: #fbbf24;
      color: #92400e;
    }

    .btn-customize:hover {
      background: #f59e0b;
    }

    .btn-apply {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .btn-apply:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
    }

    .no-jobs {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    /* Modal */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 30px;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .modal-content.modal-lg {
      max-width: 1000px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    .modal-content.modal-customize {
      max-width: 1200px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      grid-template-rows: auto auto auto auto;
    }

    .ai-customize-controls {
      grid-column: 1;
      background: #f0f9ff;
      border: 2px solid #3b82f6;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }

    .resume-selection {
      grid-column: 1;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 15px;
      border-radius: 8px;
    }

    .resume-selection label {
      display: block;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
      font-size: 0.95rem;
    }

    .resume-selector {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.9rem;
      background: white;
    }

    .resume-selector:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .resume-note {
      margin: 0;
      font-size: 0.85rem;
      color: #999;
      font-style: italic;
    }

    .btn-ai-customize {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.95rem;
      transition: all 0.3s ease;
      margin-bottom: 10px;
    }

    .btn-ai-customize:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .btn-ai-customize:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .ai-note {
      margin: 0;
      font-size: 0.85rem;
      color: #1e40af;
    }

    .modal-close {
      position: absolute;
      top: 15px;
      right: 15px;
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #999;
      cursor: pointer;
    }

    .modal-close:hover {
      color: #333;
    }

    .modal-content h3 {
      margin-top: 0;
      color: #091C43;
    }

    .modal-company {
      color: #3b82f6;
      font-weight: 600;
      margin: 5px 0 15px 0;
    }

    .modal-body {
      margin: 20px 0;
    }

    .modal-body p {
      margin: 8px 0;
      line-height: 1.6;
    }

    .job-description,
    .job-requirements {
      margin-top: 15px;
    }

    .job-requirements ul {
      margin: 8px 0;
      padding-left: 20px;
    }

    .job-requirements li {
      margin: 4px 0;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .btn-external {
      flex: 1;
      padding: 10px;
      background: #f3f4f6;
      color: #374151;
      text-decoration: none;
      border-radius: 6px;
      text-align: center;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-external:hover {
      background: #e5e7eb;
    }

    .btn-cancel {
      flex: 1;
      padding: 10px;
      background: #f3f4f6;
      color: #374151;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-cancel:hover {
      background: #e5e7eb;
    }

    .customize-container {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
      grid-column: 1;
    }

    .customize-original,
    .customize-sidebar,
    .customize-preview {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .customize-original h4,
    .customize-sidebar h4,
    .customize-preview h4 {
      margin: 0 0 10px 0;
      color: #091C43;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .customize-sidebar {
      border-left: 2px solid #e5e7eb;
      padding-left: 15px;
    }

    .customize-sidebar p {
      font-size: 0.9rem;
      line-height: 1.6;
      color: #4b5563;
      margin: 0;
    }

    .job-requirements-text {
      font-size: 0.9rem;
      line-height: 1.6;
      color: #4b5563;
    }

    .job-requirements-text p {
      margin: 6px 0;
    }

    .job-requirements-text .description {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
    }

    .resume-full {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .resume-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .resume-section h5 {
      margin: 0;
      color: #1f2937;
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
    }

    .resume-section p {
      margin: 0;
      font-size: 0.85rem;
      color: #4b5563;
    }

    .summary {
      font-style: italic;
      color: #666;
    }

    .skills-list {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .skill-badge {
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .exp-item,
    .edu-item {
      padding: 8px 0;
    }

    .exp-header,
    .edu-header {
      margin: 0;
      font-size: 0.85rem;
      color: #1f2937;
    }

    .exp-date,
    .edu-inst {
      margin: 2px 0;
      font-size: 0.8rem;
      color: #999;
    }

    .customized-resume {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .customized-resume .resume-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .customized-resume .resume-section h5 {
      margin: 0;
      color: #1f2937;
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
    }

    @media (max-width: 1024px) {
      .customize-container {
        grid-template-columns: 1fr;
        gap: 15px;
      }

      .customize-sidebar {
        border-left: none;
        padding-left: 0;
        border-top: 2px solid #e5e7eb;
        padding-top: 15px;
      }

      .modal-content.modal-customize {
        max-width: 800px;
      }
    }

    @media (max-width: 768px) {
      .search-form {
        grid-template-columns: 1fr;
      }

      .jobs-grid {
        grid-template-columns: 1fr;
      }

      .modal-content.modal-lg {
        grid-template-columns: 1fr;
      }

      .auto-apply-settings {
        grid-template-columns: 1fr;
      }

      .customize-container {
        grid-template-columns: 1fr;
      }

      .modal-content.modal-customize {
        max-width: 100%;
        margin: 10px;
      }

      .resume-preview {
        max-height: 300px !important;
      }
    }
  `]
})
export class JobFinderComponent implements OnInit, OnDestroy {
  matchedJobs: JobMatch[] = [];
  selectedJob: JobListing | null = null;
  customizingJob: JobListing | null = null;
  customizedResumePreview: string = '';
  userResume: any = null;
  availableResumes: any[] = [];
  selectedResumeId: string = '';

  isSearching = false;
  isCustomizing = false;
  isLoadingResumes = false;
  connectedPlatforms: string[] = [];
  autoApplyStatus = '';

  searchParams = {
    keywords: '',
    location: '',
    jobType: '',
    salaryMin: undefined,
    salaryMax: undefined
  };

  autoApplyConfig = {
    enabled: false,
    jobsPerDay: 5,
    minMatchScore: 70,
    excludeCompanies: [],
    preferredLocations: [],
    preferredJobTypes: []
  };

  private destroy$ = new Subject<void>();

  constructor(private jobService: JobIntegrationService) {}

  ngOnInit() {
    this.loadConnectedPlatforms();
    this.loadAutoApplyConfig();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  searchJobs() {
    if (!this.searchParams.keywords.trim() || !this.searchParams.location.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Search Required',
        text: 'Please enter job keywords and location'
      });
      return;
    }

    this.isSearching = true;
    console.log('[JobFinder] Searching jobs with:', this.searchParams);
    this.jobService.searchJobs(
      this.searchParams.keywords,
      this.searchParams.location,
      this.searchParams.jobType || undefined
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (jobs: JobListing[]) => {
        this.isSearching = false;
        console.log('[JobFinder] Jobs received:', jobs);
        // Match jobs to resume
        this.jobService.matchResumeToJobs('current-resume-id', jobs)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (matches: JobMatch[]) => {
              console.log('[JobFinder] Resume matches:', matches);
              this.matchedJobs = matches.sort((a: JobMatch, b: JobMatch) => b.matchPercentage - a.matchPercentage);
            },
            error: (error: any) => {
              console.error('[JobFinder] Matching error:', error);
              Swal.fire('Error', 'Failed to match jobs', 'error');
            }
          });
      },
      error: (error: any) => {
        this.isSearching = false;
        console.error('[JobFinder] Search error:', error);
        Swal.fire('Error', 'Failed to search jobs', 'error');
      }
    });
  }

  viewJobDetails(job: JobListing) {
    this.selectedJob = job;
  }

  closeJobDetails() {
    this.selectedJob = null;
  }

  customizeResume(job: JobListing) {
    console.log('=== JOB FINDER: customizeResume called for:', job.title);
    this.customizingJob = job;
    this.customizedResumePreview = '';
    this.selectedResumeId = '';
    this.userResume = null; // Force reload
    this.loadAvailableResumes();
  }

  loadAvailableResumes() {
    console.log('=== JOB FINDER: loadAvailableResumes called ===');
    this.isLoadingResumes = true;
    
    // First check localStorage for saved resume
    const savedResumeMetadata = localStorage.getItem('currentResumeMetadata');
    console.log('📋 Checking localStorage for currentResumeMetadata...', savedResumeMetadata);
    
    if (savedResumeMetadata) {
      try {
        const metadata = JSON.parse(savedResumeMetadata);
        console.log('✓ Found resume metadata in localStorage:', metadata);
        this.availableResumes = [metadata];
        this.isLoadingResumes = false;
        
        // Auto-load the saved resume
        this.selectedResumeId = metadata.id;
        console.log('Auto-selecting resume ID:', this.selectedResumeId);
        this.loadSelectedResume();
        return;
      } catch (e) {
        console.error('✗ Error parsing saved resume metadata:', e);
      }
    }
    
    console.log('❌ No resume in localStorage, trying backend...');
    
    // Fallback: try to get from backend
    this.jobService.getUserResumes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resumes: any[]) => {
          console.log('Backend returned resumes:', resumes);
          this.isLoadingResumes = false;
          this.availableResumes = resumes;
          
          // If no resumes from backend, load from localStorage
          if (resumes.length === 0) {
            console.log('No resumes from backend, loading from localStorage');
            this.loadUserResume();
          } else if (resumes.length === 1) {
            // Auto-select if only one resume available
            this.selectedResumeId = resumes[0].id;
            this.loadSelectedResume();
          }
        },
        error: (error: any) => {
          this.isLoadingResumes = false;
          console.error('✗ Error loading resumes from backend:', error);
          // Fallback to default resume
          console.log('Falling back to localStorage');
          this.loadUserResume();
        }
      });
  }

  loadSelectedResume() {
    console.log('=== JOB FINDER: loadSelectedResume called ===');
    console.log('selectedResumeId:', this.selectedResumeId);
    
    if (!this.selectedResumeId) {
      console.log('No selected resume ID, loading default');
      this.loadUserResume();
      return;
    }

    // Check if this is the "current-resume" id (saved resume)
    if (this.selectedResumeId === 'current-resume') {
      console.log('📋 Trying to load current-resume from localStorage...');
      const savedResume = localStorage.getItem('userResume');
      console.log('Retrieved from localStorage:', savedResume ? '✓ Found' : '❌ Not found');
      
      if (savedResume) {
        try {
          this.userResume = JSON.parse(savedResume);
          console.log('✓ Successfully loaded saved resume from localStorage');
          console.log('Resume personalInfo:', this.userResume.personalInfo);
          return;
        } catch (e) {
          console.error('✗ Error parsing saved resume from localStorage:', e);
        }
      }
    }

    // Try to get from backend
    console.log('Attempting to load from backend...');
    const resume = this.availableResumes.find(r => r.id === this.selectedResumeId);
    if (resume) {
      this.jobService.getResumeById(this.selectedResumeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (resumeData: any) => {
            this.userResume = resumeData.data || resumeData;
            console.log('✓ Loaded resume from backend:', this.userResume);
          },
          error: (error: any) => {
            console.error('✗ Error loading resume from backend:', error);
            // Fallback to loading current resume from localStorage
            this.loadUserResume();
          }
        });
    }
  }

  loadUserResume() {
    console.log('=== JOB FINDER: loadUserResume called ===');
    
    // Try to load from localStorage first
    console.log('📋 Attempting to load from localStorage...');
    const savedResume = localStorage.getItem('userResume');
    console.log('localStorage userResume status:', savedResume ? '✓ Found' : '❌ Not found');
    
    if (savedResume) {
      try {
        this.userResume = JSON.parse(savedResume);
        console.log('✓ SUCCESS: Loaded user resume from localStorage');
        console.log('Resume data:', this.userResume);
        return;
      } catch (e) {
        console.error('✗ Error parsing saved resume:', e);
      }
    }

    // If no localStorage resume, try to load from session
    console.log('📋 Attempting to load from sessionStorage...');
    const sessionResume = sessionStorage.getItem('currentResume');
    console.log('sessionStorage currentResume status:', sessionResume ? '✓ Found' : '❌ Not found');
    
    if (sessionResume) {
      try {
        this.userResume = JSON.parse(sessionResume);
        console.log('✓ SUCCESS: Loaded user resume from sessionStorage');
        console.log('Resume data:', this.userResume);
        return;
      } catch (e) {
        console.error('✗ Error parsing session resume:', e);
      }
    }

    // Default resume structure
    console.log('⚠️ Using DEFAULT placeholder resume structure (no saved resume found)');
    this.userResume = {
      personalInfo: {
        fullName: 'Your Name',
        email: 'your.email@example.com',
        phone: '+1 (555) 000-0000',
        location: 'City, State',
        summary: 'Experienced professional with a passion for technology and innovation.'
      },
      experience: [
        {
          position: 'Senior Software Engineer',
          company: 'Tech Company',
          startDate: '2021',
          endDate: 'Present',
          description: 'Led development of scalable applications and mentored junior developers.'
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          institution: 'University Name',
          graduationDate: '2021'
        }
      ],
      skills: ['JavaScript', 'TypeScript', 'Angular', '.NET', 'SQL', 'Azure', 'RESTful APIs', 'Agile']
    };
  }

  aiCustomizeResume() {
    if (!this.customizingJob || !this.userResume) {
      Swal.fire('Error', 'Resume or job data missing', 'error');
      return;
    }

    this.isCustomizing = true;
    this.jobService.aiCustomizeResume(this.userResume, this.customizingJob)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customized: any) => {
          this.isCustomizing = false;
          if (customized && customized.customizedResume) {
            this.customizedResumePreview = this.formatResumePreview(customized.customizedResume);
          } else {
            this.customizedResumePreview = this.generateCustomizedPreview();
          }
        },
        error: (error: any) => {
          this.isCustomizing = false;
          console.error('AI customization error:', error);
          // Fallback to simple customization
          this.customizedResumePreview = this.generateCustomizedPreview();
          Swal.fire('Info', 'Generated customized resume based on job requirements', 'info');
        }
      });
  }

  generateCustomizedPreview(): string {
    if (!this.customizingJob || !this.userResume) return '';

    const jobKeywords = this.customizingJob.description.toLowerCase().split(/\s+/);
    const matchedSkills = this.userResume.skills.filter((skill: string) =>
      jobKeywords.some(keyword => skill.toLowerCase().includes(keyword) || keyword.includes(skill.toLowerCase()))
    );

    let html = `
      <div class="customized-resume">
        <div class="resume-section">
          <h5>${this.userResume.personalInfo.fullName}</h5>
          <p><strong>Email:</strong> ${this.userResume.personalInfo.email}</p>
          <p><strong>Phone:</strong> ${this.userResume.personalInfo.phone}</p>
        </div>
        <div class="resume-section">
          <h5>Professional Summary</h5>
          <p>${this.userResume.personalInfo.summary} Particularly interested in roles involving ${this.customizingJob.title.split(' ').slice(-1)[0]}.</p>
        </div>
    `;

    if (matchedSkills.length > 0) {
      html += `
        <div class="resume-section">
          <h5>Relevant Skills</h5>
          <div class="skills-list">
            ${matchedSkills.map((skill: string) => `<span class="skill-badge">${skill}</span>`).join('')}
          </div>
        </div>
      `;
    }

    if (this.userResume.experience && this.userResume.experience.length > 0) {
      html += `
        <div class="resume-section">
          <h5>Professional Experience</h5>
      `;
      this.userResume.experience.forEach((exp: any) => {
        html += `
          <div class="exp-item">
            <p class="exp-header"><strong>${exp.position}</strong> - ${exp.company}</p>
            <p class="exp-date">${exp.startDate} - ${exp.endDate || 'Present'}</p>
            <p>${exp.description}</p>
          </div>
        `;
      });
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  formatResumePreview(resumeData: any): string {
    // Format the resume data returned from AI
    if (typeof resumeData === 'string') {
      return `<div class="customized-resume"><p>${resumeData}</p></div>`;
    }
    return '<div class="customized-resume"><p>Resume customized successfully</p></div>';
  }

  closeCustomizeResume() {
    this.customizingJob = null;
    this.customizedResumePreview = '';
  }

  applyWithCustomizedResume() {
    if (this.customizingJob) {
      this.applyToJob(this.customizingJob);
      this.closeCustomizeResume();
    }
  }

  applyToJob(job: JobListing) {
    Swal.fire({
      title: 'Apply to Job?',
      text: `You are about to apply to ${job.title} at ${job.company}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Apply',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.jobService.applyToJob('current-user-id', job.id, 'current-resume-id')
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              Swal.fire(
                'Success!',
                `Your application to ${job.company} has been submitted`,
                'success'
              );
            },
            error: (error: any) => {
              console.error('Application error:', error);
              Swal.fire('Error', 'Failed to submit application', 'error');
            }
          });
      }
    });
  }

  loadConnectedPlatforms() {
    this.jobService.getConnectedPlatforms('current-user-id')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (platforms: string[]) => {
          this.connectedPlatforms = platforms;
        }
      });
  }

  showPlatformConnect() {
    Swal.fire({
      title: 'Connect Job Platform',
      input: 'select',
      inputOptions: {
        jooble: 'Jooble'
      },
      confirmButtonText: 'Connect'
    }).then((result) => {
      if (result.isConfirmed) {
        // Redirect to OAuth flow
        window.location.href = `/api/JobIntegration/connect-oauth/${result.value}`;
      }
    });
  }

  disconnectPlatform(platform: string) {
    Swal.fire({
      title: 'Disconnect Platform?',
      text: `Remove ${platform} integration?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Disconnect'
    }).then((result) => {
      if (result.isConfirmed) {
        this.connectedPlatforms = this.connectedPlatforms.filter(p => p !== platform);
      }
    });
  }

  loadAutoApplyConfig() {
    this.jobService.getAutoApplyConfig('current-user-id')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config: any) => {
          this.autoApplyConfig = config;
        }
      });
  }

  toggleAutoApply() {
    if (this.autoApplyConfig.enabled) {
      this.jobService.startAutoApply('current-user-id')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.autoApplyStatus = '✓ Auto-apply is now active';
          }
        });
    } else {
      this.jobService.stopAutoApply('current-user-id')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.autoApplyStatus = '✓ Auto-apply has been stopped';
          }
        });
    }
  }

  saveAutoApplyConfig() {
    this.jobService.setAutoApplyConfig(this.autoApplyConfig)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire('Success', 'Auto-apply settings saved', 'success');
        },
        error: () => {
          Swal.fire('Error', 'Failed to save settings', 'error');
        }
      });
  }
}
