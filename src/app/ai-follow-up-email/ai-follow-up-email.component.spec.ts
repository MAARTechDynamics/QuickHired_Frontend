import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiFollowUpEmailComponent } from './ai-follow-up-email.component';

describe('AiFollowUpEmailComponent', () => {
  let component: AiFollowUpEmailComponent;
  let fixture: ComponentFixture<AiFollowUpEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiFollowUpEmailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiFollowUpEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
