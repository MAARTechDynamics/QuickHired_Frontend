import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionCallbackComponent } from './subscription-callback.component';

describe('SubscriptionCallbackComponent', () => {
  let component: SubscriptionCallbackComponent;
  let fixture: ComponentFixture<SubscriptionCallbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionCallbackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscriptionCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
