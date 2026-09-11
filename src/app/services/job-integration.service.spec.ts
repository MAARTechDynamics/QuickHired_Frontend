import { TestBed } from '@angular/core/testing';

import { JobIntegrationService } from './job-integration.service';

describe('JobIntegrationService', () => {
  let service: JobIntegrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JobIntegrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
