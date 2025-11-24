import api from './api';
import { MediaFile } from '@/types';

export interface ImageEditRequest {
  mediaFileId: number;
  editType: 'crop' | 'rotate' | 'flip' | 'brightness' | 'contrast' | 'filter' | 'resize';

  // Crop parameters
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;

  // Rotate parameters
  rotateDegrees?: number;

  // Flip parameters
  flipHorizontal?: boolean;

  // Adjustment parameters
  brightness?: number; // -1.0 to 1.0
  contrast?: number; // -1.0 to 1.0

  // Filter parameters
  filterType?: 'grayscale' | 'sepia';

  // Resize parameters
  resizeWidth?: number;
  resizeHeight?: number;
}

export interface ImageEditResponse {
  message: string;
  mediaFile: MediaFile;
}

const imageEditingService = {
  editImage: async (request: ImageEditRequest): Promise<ImageEditResponse> => {
    const response = await api.post('/image-editing/edit', request);
    return response.data;
  },
};

export default imageEditingService;
