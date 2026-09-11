import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HirevueInterviewComponent } from './hirevue-interview.component';

describe('HirevueInterviewComponent', () => {
  let component: HirevueInterviewComponent;
  let fixture: ComponentFixture<HirevueInterviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HirevueInterviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HirevueInterviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
