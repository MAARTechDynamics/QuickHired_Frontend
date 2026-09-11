import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiStepInterviewComponent } from './multi-step-interview.component';

describe('MultiStepInterviewComponent', () => {
  let component: MultiStepInterviewComponent;
  let fixture: ComponentFixture<MultiStepInterviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiStepInterviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiStepInterviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
