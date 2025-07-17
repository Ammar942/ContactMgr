import { Injectable } from '@angular/core';
import { Contact } from '../shared/models/contact.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { Observable } from 'rxjs';

interface ContactListResponse {
  contacts: Contact[];
  currentPage: number;
  totalPages: number;
  totalContacts: number;
}
@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private apiUrl = 'http://localhost:5000/api/contacts';
  constructor(private http: HttpClient, private authService: AuthService) {}
  addContact(
    contact: Omit<
      Contact,
      '_id' | 'createdAt' | 'updatedAt' | 'lockedBy' | 'lockedAt'
    >
  ): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, contact);
  }
  getContacts(
    page: number = 1,
    filters: { name?: string; phone?: string; address?: string } = {}
  ): Observable<ContactListResponse> {
    let params = new HttpParams().set('page', page.toString());
    if (filters.name) {
      params = params.set('name', filters.name);
    }
    if (filters.phone) {
      params = params.set('phone', filters.phone);
    }
    if (filters.address) {
      params = params.set('address', filters.address);
    }
    return this.http.get<ContactListResponse>(this.apiUrl, { params });
  }
  updateContact(
    contactId: string,
    contact: Partial<Contact>
  ): Observable<Contact> {
    const userId = this.authService.getUserId;
    return this.http.put<Contact>(`${this.apiUrl}/${contactId}`, {
      ...contact,
      userId,
    });
  }
  deleteContact(contactId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${contactId}`);
  }
  lockContact(contactId: string): void {
    const userId = this.authService.getUserId;
    if (userId && this.authService.socket) {
      this.authService.socket.emit('lockContact', { contactId, userId });
    }
  }
  unlockContact(contactId: string): void {
    const userId = this.authService.getUserId;
    if (userId && this.authService.socket) {
      this.authService.socket.emit('unlockContact', { contactId, userId });
    }
  }
}
