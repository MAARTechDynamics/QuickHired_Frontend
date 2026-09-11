import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordMeetingsComponent } from './record-meetings.component';

describe('RecordMeetingsComponent', () => {
  let component: RecordMeetingsComponent;
  let fixture: ComponentFixture<RecordMeetingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordMeetingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecordMeetingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
