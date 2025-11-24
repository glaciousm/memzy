import { WatchedFolder } from '@/types';
import apiService from './api';

class WatchedFolderService {
  async addWatchedFolder(
    folderPath: string,
    recursiveScan: boolean = true,
    autoImport: boolean = true,
    scanIntervalMinutes: number = 60
  ): Promise<WatchedFolder> {
    const response = await apiService.post<WatchedFolder>('/watched-folders', {
      folderPath,
      recursiveScan,
      autoImport,
      scanIntervalMinutes,
    });
    return response.data;
  }

  async getUserWatchedFolders(): Promise<WatchedFolder[]> {
    const response = await apiService.get<WatchedFolder[]>('/watched-folders');
    return response.data;
  }

  async getWatchedFolderById(id: number): Promise<WatchedFolder> {
    const response = await apiService.get<WatchedFolder>(`/watched-folders/${id}`);
    return response.data;
  }

  async updateWatchedFolder(
    id: number,
    updates: {
      isActive?: boolean;
      recursiveScan?: boolean;
      autoImport?: boolean;
      scanIntervalMinutes?: number;
    }
  ): Promise<WatchedFolder> {
    const response = await apiService.put<WatchedFolder>(`/watched-folders/${id}`, updates);
    return response.data;
  }

  async deleteWatchedFolder(id: number): Promise<void> {
    await apiService.delete(`/watched-folders/${id}`);
  }

  async scanNow(id: number): Promise<{ importedCount: number }> {
    const response = await apiService.post<{ importedCount: number }>(
      `/watched-folders/${id}/scan`
    );
    return response.data;
  }
}

export const watchedFolderService = new WatchedFolderService();
export default watchedFolderService;
