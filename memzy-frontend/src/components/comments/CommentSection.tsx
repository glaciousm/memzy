import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Divider,
} from '@mui/material';
import { MoreVert, Send } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatDistanceToNow } from 'date-fns';
import commentService from '@/services/commentService';
import { Comment } from '@/types';
import { useAppSelector } from '@/hooks/useRedux';

interface CommentSectionProps {
  mediaFileId: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ mediaFileId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAppSelector((state) => state.auth);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadComments();
  }, [mediaFileId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentService.getMediaComments(mediaFileId);
      setComments(data);
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load comments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const comment = await commentService.createComment(mediaFileId, newComment);
      setComments([comment, ...comments]);
      setNewComment('');
      enqueueSnackbar('Comment added', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to add comment', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, comment: Comment) => {
    setAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedComment(null);
  };

  const handleEditStart = () => {
    if (selectedComment) {
      setEditingCommentId(selectedComment.id);
      setEditContent(selectedComment.content);
    }
    handleMenuClose();
  };

  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleEditSave = async (commentId: number) => {
    if (!editContent.trim()) return;

    try {
      const updatedComment = await commentService.updateComment(commentId, editContent);
      setComments(comments.map((c) => (c.id === commentId ? updatedComment : c)));
      setEditingCommentId(null);
      setEditContent('');
      enqueueSnackbar('Comment updated', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to update comment', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!selectedComment) return;

    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await commentService.deleteComment(selectedComment.id);
        setComments(comments.filter((c) => c.id !== selectedComment.id));
        enqueueSnackbar('Comment deleted', { variant: 'success' });
      } catch (error: any) {
        enqueueSnackbar(error.message || 'Failed to delete comment', { variant: 'error' });
      }
    }
    handleMenuClose();
  };

  const getUserDisplayName = (comment: Comment): string => {
    if (comment.user.firstName || comment.user.lastName) {
      return `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim();
    }
    return comment.user.username;
  };

  const getInitials = (comment: Comment): string => {
    if (comment.user.firstName && comment.user.lastName) {
      return `${comment.user.firstName[0]}${comment.user.lastName[0]}`.toUpperCase();
    }
    return comment.user.username.substring(0, 2).toUpperCase();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Comments ({comments.length})
      </Typography>

      {/* Add Comment */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {user?.firstName ? user.firstName[0].toUpperCase() : user?.username.substring(0, 1).toUpperCase()}
        </Avatar>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submitting}
        />
        <IconButton
          color="primary"
          onClick={handleSubmitComment}
          disabled={!newComment.trim() || submitting}
          sx={{ alignSelf: 'flex-end' }}
        >
          {submitting ? <CircularProgress size={24} /> : <Send />}
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Comments List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No comments yet. Be the first to comment!
        </Typography>
      ) : (
        <List sx={{ p: 0 }}>
          {comments.map((comment, index) => (
            <React.Fragment key={comment.id}>
              {index > 0 && <Divider sx={{ my: 2 }} />}
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <Avatar
                  src={comment.user.avatarUrl}
                  sx={{ mr: 2, bgcolor: 'secondary.main' }}
                >
                  {getInitials(comment)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {getUserDisplayName(comment)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        {comment.updatedAt !== comment.createdAt && ' (edited)'}
                      </Typography>
                    </Box>
                    {user?.id === comment.user.id && (
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, comment)}>
                        <MoreVert fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  {editingCommentId === comment.id ? (
                    <Box sx={{ mt: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" onClick={handleEditCancel}>
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleEditSave(comment.id)}
                          disabled={!editContent.trim()}
                        >
                          Save
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                      {comment.content}
                    </Typography>
                  )}
                </Box>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditStart}>Edit</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </Box>
  );
};

export default CommentSection;
