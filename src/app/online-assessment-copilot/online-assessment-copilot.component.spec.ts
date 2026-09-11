import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnlineAssessmentCopilotComponent } from './online-assessment-copilot.component';

describe('OnlineAssessmentCopilotComponent', () => {
  let component: OnlineAssessmentCopilotComponent;
  let fixture: ComponentFixture<OnlineAssessmentCopilotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnlineAssessmentCopilotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnlineAssessmentCopilotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
