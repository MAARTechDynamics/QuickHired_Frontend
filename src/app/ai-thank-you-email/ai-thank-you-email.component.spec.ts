import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiThankYouEmailComponent } from './ai-thank-you-email.component';

describe('AiThankYouEmailComponent', () => {
  let component: AiThankYouEmailComponent;
  let fixture: ComponentFixture<AiThankYouEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiThankYouEmailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiThankYouEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
