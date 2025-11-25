import api from './api';
import { MediaFile } from '@/types';

export interface DuplicateGroup {
  hash: string;
  files: MediaFile[];
}

export interface DuplicateStats {
  duplicateGroups: number;
  totalDuplicateFiles: number;
  totalWastedSpace: number;
  totalWastedSpaceMB: number;
}

const duplicateFinderService = {
  findByHash: async (): Promise<{ message: string; duplicateGroups: Record<string, MediaFile[]>; totalGroups: number }> => {
    const response = await api.get('/duplicates/by-hash');
    return response.data;
  },

  findBySize: async (): Promise<{ message: string; duplicateGroups: Record<number, MediaFile[]> }> => {
    const response = await api.get('/duplicates/by-size');
    return response.data;
  },

  findByName: async (threshold: number = 0.8): Promise<{ message: string; similarGroups: MediaFile[][] }> => {
    const response = await api.get(`/duplicates/by-name?threshold=${threshold}`);
    return response.data;
  },

  findByDimensions: async (): Promise<{ message: string; duplicateGroups: Record<string, MediaFile[]> }> => {
    const response = await api.get('/duplicates/by-dimensions');
    return response.data;
  },

  getStats: async (): Promise<DuplicateStats> => {
    const response = await api.get('/duplicates/stats');
    return response.data;
  },
};

export default duplicateFinderService;
