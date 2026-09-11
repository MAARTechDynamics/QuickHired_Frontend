import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AHelpCenterComponent } from './a-help-center.component';

describe('AHelpCenterComponent', () => {
  let component: AHelpCenterComponent;
  let fixture: ComponentFixture<AHelpCenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AHelpCenterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AHelpCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
