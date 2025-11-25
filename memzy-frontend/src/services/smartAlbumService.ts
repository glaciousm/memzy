import api from './api';
import { MediaFile } from '@/types';

export interface SmartAlbumRule {
  id?: number;
  field: string;
  operator: string;
  value: string;
  value2?: string;
  sortOrder?: number;
}

export interface SmartAlbum {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  matchType: 'ALL' | 'ANY';
  rules: SmartAlbumRule[];
  mediaCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSmartAlbumRequest {
  name: string;
  description?: string;
  matchType: 'ALL' | 'ANY';
  rules: SmartAlbumRule[];
}

const smartAlbumService = {
  createSmartAlbum: async (request: CreateSmartAlbumRequest): Promise<{ message: string; smartAlbum: SmartAlbum }> => {
    const response = await api.post('/smart-albums', request);
    return response.data;
  },

  getUserSmartAlbums: async (): Promise<SmartAlbum[]> => {
    const response = await api.get('/smart-albums');
    return response.data;
  },

  getSmartAlbumById: async (id: number): Promise<SmartAlbum> => {
    const response = await api.get(`/smart-albums/${id}`);
    return response.data;
  },

  getSmartAlbumMedia: async (id: number): Promise<MediaFile[]> => {
    const response = await api.get(`/smart-albums/${id}/media`);
    return response.data;
  },

  updateSmartAlbum: async (id: number, request: CreateSmartAlbumRequest): Promise<{ message: string; smartAlbum: SmartAlbum }> => {
    const response = await api.put(`/smart-albums/${id}`, request);
    return response.data;
  },

  deleteSmartAlbum: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/smart-albums/${id}`);
    return response.data;
  },
};

export default smartAlbumService;
