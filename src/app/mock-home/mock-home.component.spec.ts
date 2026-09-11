import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MockHomeComponent } from './mock-home.component';

describe('MockHomeComponent', () => {
  let component: MockHomeComponent;
  let fixture: ComponentFixture<MockHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MockHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
