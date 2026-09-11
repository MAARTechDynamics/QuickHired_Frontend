import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricingHomeComponent } from './pricing-home.component';

describe('PricingHomeComponent', () => {
  let component: PricingHomeComponent;
  let fixture: ComponentFixture<PricingHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PricingHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
