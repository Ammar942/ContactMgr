import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Router } from '@angular/router';

interface AuthResponse {
  id: string;
  username: string;
  role: string;
  token: string;
}
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  private token: string | null = null;
  private userId: string | null = null;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  socket!: Socket;
  constructor(private http: HttpClient, private router: Router) {
    this.loadToken();
    if (this.isAuthenticated$) {
      this.connectSocket();
    }
  }

  get getToken(): string | null {
    return this.token;
  }

  get getUserId(): string | null {
    return this.userId;
  }
  get isAuthenticated(): boolean {
    return !!this.token;
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, {
        username,
        password,
      })
      .pipe(
        tap((res) => {
          this.setAuthData(res);
          this.connectSocket();
        })
      );
  }
  logout(): void {
    this.token = null;
    this.userId = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    this.isAuthenticatedSubject.next(false);
    if (this.socket) {
      this.socket.disconnect();
    }
    this.router.navigate(['/login']);
  }
  private loadToken(): void {
    this.token = localStorage.getItem('token');
    this.userId = localStorage.getItem('userId');
    if (this.token) {
      this.isAuthenticatedSubject.next(true);
    }
  }
  private setAuthData(res: AuthResponse): void {
    this.token = res.token;
    this.userId = res.id;
    localStorage.setItem('token', res.token);
    localStorage.setItem('userId', res.id);
    this.isAuthenticatedSubject.next(true);
  }
  private connectSocket(): void {
    if (!this.socket || !this.socket.connected) {
      this.socket = io('http://localhost:5000');
      this.socket.on('connect', () => {
        console.log('Socket connected', this.socket.id);
      });
    }
    this.socket.on('disconnect', () => {
      console.log('socket disconnected');
    });
  }
}
