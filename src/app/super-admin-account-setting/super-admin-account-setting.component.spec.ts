import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminAccountSettingComponent } from './super-admin-account-setting.component';

describe('SuperAdminAccountSettingComponent', () => {
  let component: SuperAdminAccountSettingComponent;
  let fixture: ComponentFixture<SuperAdminAccountSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminAccountSettingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminAccountSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
