import { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';
import apiService from './api';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    this.setAuthData(response.data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', data);
    this.setAuthData(response.data);
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private setAuthData(authResponse: AuthResponse): void {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('refreshToken', authResponse.refreshToken);

    const user: User = {
      id: authResponse.id,
      username: authResponse.username,
      email: authResponse.email,
      firstName: authResponse.firstName,
      lastName: authResponse.lastName,
      avatarUrl: authResponse.avatarUrl,
      roles: authResponse.roles,
    };

    localStorage.setItem('user', JSON.stringify(user));
  }
}

export const authService = new AuthService();
export default authService;
