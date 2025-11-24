import { MediaFile, PageResponse, MediaType } from '@/types';
import apiService from './api';

export interface SearchParams {
  mediaType?: MediaType;
  tagIds?: number[];
  startDate?: Date | null;
  endDate?: Date | null;
  isFavorite?: boolean | null;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

class MediaService {
  async uploadMedia(file: File): Promise<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiService.post<MediaFile>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async getUserMedia(page: number = 0, size: number = 20, sortBy: string = 'createdAt', sortDirection: string = 'DESC'): Promise<PageResponse<MediaFile>> {
    const response = await apiService.get<PageResponse<MediaFile>>('/media', {
      params: { page, size, sortBy, sortDirection },
    });

    return response.data;
  }

  async searchMedia(searchParams: SearchParams): Promise<PageResponse<MediaFile>> {
    const params: any = {
      page: searchParams.page ?? 0,
      size: searchParams.size ?? 20,
      sortBy: searchParams.sortBy ?? 'createdAt',
      sortDirection: searchParams.sortDirection ?? 'DESC',
    };

    if (searchParams.mediaType && searchParams.mediaType !== 'ALL') {
      params.mediaType = searchParams.mediaType;
    }

    if (searchParams.tagIds && searchParams.tagIds.length > 0) {
      params.tagIds = searchParams.tagIds;
    }

    if (searchParams.startDate) {
      params.startDate = searchParams.startDate.toISOString();
    }

    if (searchParams.endDate) {
      params.endDate = searchParams.endDate.toISOString();
    }

    if (searchParams.isFavorite !== null && searchParams.isFavorite !== undefined) {
      params.isFavorite = searchParams.isFavorite;
    }

    const response = await apiService.get<PageResponse<MediaFile>>('/search', {
      params,
    });

    return response.data;
  }

  async getMediaById(id: number): Promise<MediaFile> {
    const response = await apiService.get<MediaFile>(`/media/${id}`);
    return response.data;
  }

  async deleteMedia(id: number): Promise<void> {
    await apiService.delete(`/media/${id}`);
  }

  async toggleFavorite(id: number): Promise<MediaFile> {
    const response = await apiService.patch<MediaFile>(`/media/${id}/favorite`);
    return response.data;
  }

  getThumbnailUrl(thumbnailPath: string, size: number = 300): string {
    const filename = thumbnailPath.split('/').pop();
    return `http://localhost:8080/api/files/thumbnails/${size}/${filename}`;
  }

  getOriginalUrl(filePath: string): string {
    const filename = filePath.split('/').pop();
    return `http://localhost:8080/api/files/original/${filename}`;
  }
}

export const mediaService = new MediaService();
export default mediaService;
