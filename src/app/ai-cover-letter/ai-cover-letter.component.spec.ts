import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiCoverLetterComponent } from './ai-cover-letter.component';

describe('AiCoverLetterComponent', () => {
  let component: AiCoverLetterComponent;
  let fixture: ComponentFixture<AiCoverLetterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiCoverLetterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiCoverLetterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
