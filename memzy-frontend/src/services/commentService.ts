import { Comment } from '@/types';
import apiService from './api';

class CommentService {
  async createComment(mediaFileId: number, content: string): Promise<Comment> {
    const response = await apiService.post<Comment>('/comments', {
      mediaFileId,
      content,
    });
    return response.data;
  }

  async getMediaComments(mediaFileId: number): Promise<Comment[]> {
    const response = await apiService.get<Comment[]>(`/comments/media/${mediaFileId}`);
    return response.data;
  }

  async updateComment(commentId: number, content: string): Promise<Comment> {
    const response = await apiService.put<Comment>(`/comments/${commentId}`, {
      content,
    });
    return response.data;
  }

  async deleteComment(commentId: number): Promise<void> {
    await apiService.delete(`/comments/${commentId}`);
  }
}

export const commentService = new CommentService();
export default commentService;
