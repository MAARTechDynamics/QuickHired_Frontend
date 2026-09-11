import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiColdOutReachEmailComponent } from './ai-cold-out-reach-email.component';

describe('AiColdOutReachEmailComponent', () => {
  let component: AiColdOutReachEmailComponent;
  let fixture: ComponentFixture<AiColdOutReachEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiColdOutReachEmailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiColdOutReachEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
