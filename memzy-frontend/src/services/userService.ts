import { User } from '@/types';
import apiService from './api';

interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

class UserService {
  async getProfile(): Promise<User> {
    const response = await apiService.get<User>('/users/profile');
    return response.data;
  }

  async updateProfile(updates: ProfileUpdateData): Promise<{ message: string; user: User }> {
    const response = await apiService.put<{ message: string; user: User }>(
      '/users/profile',
      updates
    );
    return response.data;
  }

  async changePassword(passwordData: PasswordChangeData): Promise<{ message: string }> {
    const response = await apiService.put<{ message: string }>(
      '/users/password',
      passwordData
    );
    return response.data;
  }
}

export const userService = new UserService();
export default userService;
