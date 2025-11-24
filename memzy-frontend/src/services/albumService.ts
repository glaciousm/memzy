import { Album, MediaFile } from '@/types';
import apiService from './api';

class AlbumService {
  async createAlbum(name: string, description?: string, parentId?: number): Promise<Album> {
    const response = await apiService.post<Album>('/albums', {
      name,
      description,
      parentId,
    });

    return response.data;
  }

  async getUserAlbums(): Promise<Album[]> {
    const response = await apiService.get<Album[]>('/albums');
    return response.data;
  }

  async getAlbumById(id: number): Promise<Album> {
    const response = await apiService.get<Album>(`/albums/${id}`);
    return response.data;
  }

  async getAlbumMedia(albumId: number): Promise<MediaFile[]> {
    const response = await apiService.get<MediaFile[]>(`/albums/${albumId}/media`);
    return response.data;
  }

  async updateAlbum(id: number, name: string, description?: string): Promise<Album> {
    const response = await apiService.put<Album>(`/albums/${id}`, {
      name,
      description,
    });

    return response.data;
  }

  async deleteAlbum(id: number): Promise<void> {
    await apiService.delete(`/albums/${id}`);
  }

  async addMediaToAlbum(albumId: number, mediaId: number): Promise<Album> {
    const response = await apiService.post<Album>(`/albums/${albumId}/media/${mediaId}`);
    return response.data;
  }

  async removeMediaFromAlbum(albumId: number, mediaId: number): Promise<Album> {
    const response = await apiService.delete<Album>(`/albums/${albumId}/media/${mediaId}`);
    return response.data;
  }
}

export const albumService = new AlbumService();
export default albumService;
