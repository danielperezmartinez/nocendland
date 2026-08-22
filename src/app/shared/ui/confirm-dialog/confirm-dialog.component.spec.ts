import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm-dialog.component';
import {DIALOG_DATA} from '@shared/ui/dialog/dialog.tokens';
import {DialogRef} from '@shared/ui/dialog/dialog-ref';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        {provide: DIALOG_DATA, useValue: {title: 'Confirmar', message: 'Mensaje'}},
        {provide: DialogRef, useValue: {close: () => undefined}},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
