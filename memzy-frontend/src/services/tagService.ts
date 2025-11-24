import { Tag } from '@/types';
import apiService from './api';

class TagService {
  async createTag(name: string, colorCode?: string, description?: string): Promise<Tag> {
    const response = await apiService.post<Tag>('/tags', {
      name,
      colorCode,
      description,
    });

    return response.data;
  }

  async getUserTags(): Promise<Tag[]> {
    const response = await apiService.get<Tag[]>('/tags');
    return response.data;
  }

  async searchTags(query: string): Promise<Tag[]> {
    const response = await apiService.get<Tag[]>('/tags/search', {
      params: { query },
    });

    return response.data;
  }

  async getTagById(id: number): Promise<Tag> {
    const response = await apiService.get<Tag>(`/tags/${id}`);
    return response.data;
  }

  async updateTag(id: number, name: string, colorCode?: string, description?: string): Promise<Tag> {
    const response = await apiService.put<Tag>(`/tags/${id}`, {
      name,
      colorCode,
      description,
    });

    return response.data;
  }

  async deleteTag(id: number): Promise<void> {
    await apiService.delete(`/tags/${id}`);
  }

  async addTagToMedia(mediaId: number, tagId: number): Promise<void> {
    await apiService.post(`/tags/media/${mediaId}/tags/${tagId}`);
  }

  async removeTagFromMedia(mediaId: number, tagId: number): Promise<void> {
    await apiService.delete(`/tags/media/${mediaId}/tags/${tagId}`);
  }
}

export const tagService = new TagService();
export default tagService;
