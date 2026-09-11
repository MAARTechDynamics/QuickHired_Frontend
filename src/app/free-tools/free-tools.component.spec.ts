import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreeToolsComponent } from './free-tools.component';

describe('FreeToolsComponent', () => {
  let component: FreeToolsComponent;
  let fixture: ComponentFixture<FreeToolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeToolsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreeToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
