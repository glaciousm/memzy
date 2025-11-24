import api from './api';
import mediaService from './mediaService';

const batchOperationsService = {
  deleteMultiple: async (ids: number[]): Promise<void> => {
    // Delete media files one by one
    await Promise.all(ids.map((id) => mediaService.deleteMedia(id)));
  },

  addToFavorites: async (ids: number[]): Promise<void> => {
    // Add to favorites one by one
    await Promise.all(
      ids.map((id) =>
        api.patch(`/media/${id}/favorite`, { isFavorite: true })
      )
    );
  },

  removeFromFavorites: async (ids: number[]): Promise<void> => {
    // Remove from favorites one by one
    await Promise.all(
      ids.map((id) =>
        api.patch(`/media/${id}/favorite`, { isFavorite: false })
      )
    );
  },

  addToAlbum: async (albumId: number, mediaIds: number[]): Promise<void> => {
    // Add media to album one by one
    await Promise.all(
      mediaIds.map((mediaId) =>
        api.post(`/albums/${albumId}/media/${mediaId}`)
      )
    );
  },

  addTagsToMedia: async (tagIds: number[], mediaIds: number[]): Promise<void> => {
    // Add tags to media files
    const promises = [];
    for (const tagId of tagIds) {
      for (const mediaId of mediaIds) {
        promises.push(api.post(`/tags/${tagId}/media/${mediaId}`));
      }
    }
    await Promise.all(promises);
  },

  downloadMultiple: async (ids: number[]): Promise<void> => {
    // Download multiple files
    // Note: This will trigger multiple downloads
    for (const id of ids) {
      const response = await api.get(`/media/${id}`);
      const mediaFile = response.data;
      const downloadUrl = `/api/files/original/${mediaFile.filePath.split('/').pop()}`;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = mediaFile.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Add small delay between downloads to avoid browser blocking
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  },
};

export default batchOperationsService;
