import api from './api';

export interface CloudStorage {
  id: number;
  provider: string;
  accountEmail: string;
  isActive: boolean;
  autoSync: boolean;
  syncFolderPath?: string;
  lastSyncAt?: string;
  totalFilesUploaded: number;
  totalFilesDownloaded: number;
  createdAt: string;
}

const cloudStorageService = {
  // Google Drive
  getGoogleDriveAuthUrl: async (): Promise<{ authUrl: string }> => {
    const response = await api.get('/cloud/google-drive/auth-url');
    return response.data;
  },

  handleGoogleDriveCallback: async (code: string): Promise<{ message: string; cloudStorage: CloudStorage }> => {
    const response = await api.get(`/cloud/google-drive/callback?code=${code}`);
    return response.data;
  },

  // Dropbox
  getDropboxAuthUrl: async (): Promise<{ authUrl: string }> => {
    const response = await api.get('/cloud/dropbox/auth-url');
    return response.data;
  },

  handleDropboxCallback: async (code: string): Promise<{ message: string; cloudStorage: CloudStorage }> => {
    const response = await api.get(`/cloud/dropbox/callback?code=${code}`);
    return response.data;
  },

  // General
  getUserCloudStorages: async (): Promise<CloudStorage[]> => {
    const response = await api.get('/cloud');
    return response.data;
  },

  disconnectCloudStorage: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/cloud/${id}`);
    return response.data;
  },

  toggleAutoSync: async (id: number, autoSync: boolean): Promise<{ message: string; cloudStorage: CloudStorage }> => {
    const response = await api.put(`/cloud/${id}/auto-sync`, { autoSync });
    return response.data;
  },
};

export default cloudStorageService;
