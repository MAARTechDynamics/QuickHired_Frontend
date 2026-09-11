import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewReportsComponent } from './interview-reports.component';

describe('InterviewReportsComponent', () => {
  let component: InterviewReportsComponent;
  let fixture: ComponentFixture<InterviewReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
