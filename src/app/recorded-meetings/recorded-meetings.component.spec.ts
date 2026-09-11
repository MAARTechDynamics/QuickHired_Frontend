import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordedMeetingsComponent } from './recorded-meetings.component';

describe('RecordedMeetingsComponent', () => {
  let component: RecordedMeetingsComponent;
  let fixture: ComponentFixture<RecordedMeetingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordedMeetingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecordedMeetingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
