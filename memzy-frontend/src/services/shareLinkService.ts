import api from './api';

export interface ShareLink {
  id: number;
  shareToken: string;
  shareUrl: string;
  mediaFileId?: number;
  mediaFileName?: string;
  albumId?: number;
  albumName?: string;
  isActive: boolean;
  expiresAt?: string;
  allowDownload: boolean;
  requirePassword: boolean;
  viewCount: number;
  maxViews?: number;
  createdAt: string;
}

export interface CreateShareLinkRequest {
  expirationHours?: number;
  allowDownload?: boolean;
  password?: string;
  maxViews?: number;
}

const shareLinkService = {
  createMediaShareLink: async (
    mediaFileId: number,
    request: CreateShareLinkRequest
  ): Promise<{ message: string; shareLink: ShareLink }> => {
    const params = new URLSearchParams();
    if (request.expirationHours) params.append('expirationHours', request.expirationHours.toString());
    if (request.allowDownload) params.append('allowDownload', request.allowDownload.toString());
    if (request.password) params.append('password', request.password);
    if (request.maxViews) params.append('maxViews', request.maxViews.toString());

    const response = await api.post(
      `/share/media/${mediaFileId}?${params.toString()}`
    );
    return response.data;
  },

  createAlbumShareLink: async (
    albumId: number,
    request: CreateShareLinkRequest
  ): Promise<{ message: string; shareLink: ShareLink }> => {
    const params = new URLSearchParams();
    if (request.expirationHours) params.append('expirationHours', request.expirationHours.toString());
    if (request.allowDownload) params.append('allowDownload', request.allowDownload.toString());
    if (request.password) params.append('password', request.password);
    if (request.maxViews) params.append('maxViews', request.maxViews.toString());

    const response = await api.post(
      `/share/album/${albumId}?${params.toString()}`
    );
    return response.data;
  },

  getSharedContent: async (token: string, password?: string): Promise<{ shareLink: ShareLink }> => {
    const params = password ? `?password=${encodeURIComponent(password)}` : '';
    const response = await api.get(`/share/${token}${params}`);
    return response.data;
  },

  getUserShareLinks: async (): Promise<ShareLink[]> => {
    const response = await api.get('/share/my-links');
    return response.data;
  },

  deactivateShareLink: async (shareLinkId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/share/${shareLinkId}`);
    return response.data;
  },
};

export default shareLinkService;
