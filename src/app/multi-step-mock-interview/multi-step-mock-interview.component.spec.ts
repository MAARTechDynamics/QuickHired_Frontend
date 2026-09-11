import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiStepMockInterviewComponent } from './multi-step-mock-interview.component';

describe('MultiStepMockInterviewComponent', () => {
  let component: MultiStepMockInterviewComponent;
  let fixture: ComponentFixture<MultiStepMockInterviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiStepMockInterviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiStepMockInterviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
