import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodingCopilotComponent } from './coding-copilot.component';

describe('CodingCopilotComponent', () => {
  let component: CodingCopilotComponent;
  let fixture: ComponentFixture<CodingCopilotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodingCopilotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodingCopilotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
