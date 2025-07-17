import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactFormComponent } from '../contact-form/contact-form.component';
import { Contact } from '../../shared/models/contact.model';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  takeUntil,
  fromEvent,
} from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ContactService } from '../contact.service';
@Component({
  selector: 'app-contact-list',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    ContactFormComponent,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.css',
})
export class ContactListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'name',
    'phone',
    'address',
    'note',
    'status',
    'actions',
  ];
  dataSource = new MatTableDataSource<Contact>();
  totalContacts = 0;
  currentPage = 1;
  pageSize = 5;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  addContactForm: FormGroup;
  filterForm: FormGroup;

  editingContactId: string | null = null;
  currentUserId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private contactService: ContactService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.addContactForm = this.fb.group({
      name: ['', Validators.required, Validators.pattern(/^[a-zA-Z ]{2,30}$/)],
      phone: ['', Validators.required, Validators.pattern(/^01[0-9]{9}$/)],
      address: ['', Validators.required],
      note: [''],
    });
    this.filterForm = this.fb.group({
      name: [''],
      phone: [''],
      address: [''],
    });
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId;
    this.loadContacts();
    this.setupSocketListeners();

    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadContacts();
      });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.editingContactId) {
      this.contactService.unlockContact(this.editingContactId);
    }
  }
  loadContacts(): void {
    const filters = this.filterForm.value;
    this.contactService
      .getContacts(this.currentPage, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.contacts;
          this.totalContacts = response.totalContacts;
          this.currentPage = response.currentPage;
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to load contacts.',
            'Close',
            { duration: 3000 }
          );
        },
      });
  }
  onPageChange(event: PageEvent): void {
    console.log(event.pageIndex);
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadContacts();
  }
  onAddContactSubmit(contactData: any): void {
    this.contactService
      .addContact(contactData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newContact) => {
          this.snackBar.open('Contact added successfully!', 'Close', {
            duration: 3000,
          });
          this.loadContacts();
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to add contact.',
            'Close',
            { duration: 3000 }
          );
        },
      });
  }
  startEditing(contact: Contact): void {
    if (contact.lockedBy && contact.lockedBy._id !== this.currentUserId) {
      console.log(this.currentUserId);
      this.snackBar.open(
        `This contact is currently locked by ${contact.lockedBy.username}.`,
        'Close',
        { duration: 5000 }
      );
      return;
    }

    this.contactService.lockContact(contact._id);
    this.editingContactId = contact._id;
  }
  onSaveEdit(updatedContact: Contact): void {
    if (!this.editingContactId) {
      return;
    }

    const contactToUpdate = this.dataSource.data.find(
      (c) => c._id === this.editingContactId
    );
    if (!contactToUpdate) {
      this.snackBar.open('Error: Contact not found for update.', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.contactService
      .updateContact(contactToUpdate._id, contactToUpdate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Contact updated successfully!', 'Close', {
            duration: 3000,
          });
          this.contactService.unlockContact(this.editingContactId!);
          this.editingContactId = null;
          this.loadContacts();
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to update contact.',
            'Close',
            { duration: 3000 }
          );
          this.contactService.unlockContact(this.editingContactId!);
        },
      });
  }
  onCancelEdit(contact: Contact): void {
    if (this.editingContactId === contact._id) {
      this.contactService.unlockContact(this.editingContactId);
      this.editingContactId = null;
      this.loadContacts();
    }
  }
  deleteContact(contactId: string): void {
    if (confirm('Are you sure you want to delete this contact?')) {
      this.contactService
        .deleteContact(contactId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Contact deleted successfully!', 'Close', {
              duration: 3000,
            });
            this.loadContacts();
          },
          error: (err) => {
            this.snackBar.open(
              err.error?.message || 'Failed to delete contact.',
              'Close',
              { duration: 3000 }
            );
          },
        });
    }
  }

  isLockedByAnotherUser(contact: Contact): boolean {
    return !!(contact.lockedBy && contact.lockedBy._id !== this.currentUserId);
  }
  getLockerUsername(contact: Contact): string {
    return contact.lockedBy?.username || 'Unknown';
  }
  private setupSocketListeners(): void {
    if (this.authService.socket) {
      fromEvent(this.authService.socket, 'contactLocked')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          console.log(data);
          const contactIndex = this.dataSource.data.findIndex(
            (c) => c._id === data.contactId
          );
          if (contactIndex > -1) {
            this.dataSource.data[contactIndex].lockedBy = {
              _id: data.userId,
              username: data.username || 'another user',
            };
            this.dataSource.data[contactIndex].lockedAt = data.lockedAt;
            this.dataSource._updateChangeSubscription();
            if (
              this.editingContactId === data.contactId &&
              data.userId !== this.currentUserId
            ) {
              this.snackBar.open(
                'This contact was locked by another user. Your edit session is cancelled.',
                'Close',
                { duration: 5000 }
              );
              this.editingContactId = null;
              this.loadContacts();
            }
          }
        });

      fromEvent(this.authService.socket, 'contactUnlocked')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          const contactIndex = this.dataSource.data.findIndex(
            (c) => c._id === data.contactId
          );
          if (contactIndex > -1) {
            this.dataSource.data[contactIndex].lockedBy = null;
            this.dataSource.data[contactIndex].lockedAt = null;
            this.dataSource._updateChangeSubscription();
          }
        });

      fromEvent(this.authService.socket, 'contactAlreadyLocked')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.snackBar.open(
            `Failed to lock: This contact is already locked by another user.`,
            'Close',
            { duration: 5000 }
          );
        });
      fromEvent(this.authService.socket, 'newContactAdded')
        .pipe(takeUntil(this.destroy$))
        .subscribe((newContact: Contact) => {
          this.snackBar.open(`New contact added: ${newContact.name}`, 'Close', {
            duration: 3000,
          });

          const currentData = [...this.dataSource.data];
          currentData.unshift(newContact);
          this.dataSource.data = currentData;
          this.totalContacts++;
        });
      fromEvent(this.authService.socket, 'editedContact')
        .pipe(takeUntil(this.destroy$))
        .subscribe((editedContact: Contact) => {
          this.snackBar.open(`Contact edited: ${editedContact.name}`, 'Close', {
            duration: 3000,
          });
          const index = this.dataSource.data.findIndex(
            (c) => c._id == editedContact._id
          );
          if (index > -1) {
            const data = [...this.dataSource.data];
            data[index] = editedContact;
            this.dataSource.data = data;
          }
        });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
