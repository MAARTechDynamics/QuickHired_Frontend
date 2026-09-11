import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionBankHomeComponent } from './question-bank-home.component';

describe('QuestionBankHomeComponent', () => {
  let component: QuestionBankHomeComponent;
  let fixture: ComponentFixture<QuestionBankHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionBankHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionBankHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
