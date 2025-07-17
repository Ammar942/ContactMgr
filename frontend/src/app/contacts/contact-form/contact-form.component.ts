import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Contact } from '../../shared/models/contact.model';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-form',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.css',
})
export class ContactFormComponent implements OnInit {
  @Input() contact: Contact | null = null;
  @Output() saveContact = new EventEmitter<Contact>();
  @Output() cancelEdit = new EventEmitter<void>();

  contactForm: FormGroup;
  isEditMode: boolean = false;
  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: [
        '',
        [Validators.required, Validators.pattern(/^[a-zA-Z ]{2,30}$/)],
      ],
      phone: ['', [Validators.required, Validators.pattern(/^01[0-9]{9}$/)]],
      address: [
        '',
        [Validators.required, Validators.pattern(/^[\w\s,.-]{5,100}$/)],
      ],
      note: [''],
    });
  }
  ngOnInit(): void {
    if (this.contact) {
      this.isEditMode = true;
      this.contactForm.patchValue(this.contact, { emitEvent: false });
    }
  }
  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.saveContact.emit(this.contactForm.value);
    if (!this.isEditMode) {
      this.contactForm.reset();
      this.contactForm.markAsPristine();
      this.contactForm.markAsUntouched();
      Object.keys(this.contactForm.controls).forEach((key) => {
        const control = this.contactForm.get(key);
        control?.markAsPristine();
        control?.markAsUntouched();
        console.log(key, control, control?.touched);
      });
    }
  }
  onCancel(): void {
    this.cancelEdit.emit();
  }
}
