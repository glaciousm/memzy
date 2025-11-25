import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close,
  ChevronLeft,
  ChevronRight,
  Favorite,
  FavoriteBorder,
  Download,
  Info,
  Comment as CommentIcon,
  Edit,
  Share,
} from '@mui/icons-material';
import ReactPlayer from 'react-player';
import { MediaFile, MediaType, Tag } from '@/types';
import mediaService from '@/services/mediaService';
import TagPicker from '@/components/tags/TagPicker';
import CommentSection from '@/components/comments/CommentSection';
import ImageEditor from '@/components/media/ImageEditor';
import ShareDialog from '@/components/share/ShareDialog';
import { format } from 'date-fns';

interface MediaViewerProps {
  open: boolean;
  media: MediaFile | null;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onFavoriteToggle?: (id: number) => void;
  onMediaUpdate?: (media: MediaFile) => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  open,
  media,
  onClose,
  onPrevious,
  onNext,
  onFavoriteToggle,
  onMediaUpdate,
  hasPrevious = false,
  hasNext = false,
}) => {
  const [currentTags, setCurrentTags] = useState<Tag[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    if (media) {
      setCurrentTags(media.tags);
      setTabValue(0);
    }
  }, [media]);

  const handleEditComplete = (editedMedia: MediaFile) => {
    // Notify parent about the edited media
    // You can refresh the gallery or update the media list here
    setEditorOpen(false);
  };

  if (!media) return null;

  const isVideo = media.mediaType === MediaType.VIDEO;
  const mediaUrl = mediaService.getOriginalUrl(media.filePath);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = media.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0, 0, 0, 0.95)',
          maxWidth: '95vw',
          maxHeight: '95vh',
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            zIndex: 1,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
        >
          <Close />
        </IconButton>

        {hasPrevious && (
          <IconButton
            onClick={onPrevious}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              zIndex: 1,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <ChevronLeft fontSize="large" />
          </IconButton>
        )}

        {hasNext && (
          <IconButton
            onClick={onNext}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              zIndex: 1,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <ChevronRight fontSize="large" />
          </IconButton>
        )}

        <DialogContent sx={{ p: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              bgcolor: 'black',
            }}
          >
            {isVideo ? (
              <ReactPlayer
                url={mediaUrl}
                controls
                playing
                width="100%"
                height="auto"
                style={{ maxHeight: '70vh' }}
              />
            ) : (
              <img
                src={mediaUrl}
                alt={media.fileName}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
            )}
          </Box>

          <Box sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.8)', color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {media.fileName}
                </Typography>
                <Typography variant="body2" color="grey.400">
                  {media.dateTaken
                    ? format(new Date(media.dateTaken), 'MMMM d, yyyy h:mm a')
                    : format(new Date(media.createdAt), 'MMMM d, yyyy h:mm a')}
                </Typography>
              </Box>

              <Box>
                {!isVideo && (
                  <IconButton onClick={() => setEditorOpen(true)} sx={{ color: 'white' }}>
                    <Edit />
                  </IconButton>
                )}
                <IconButton onClick={() => setShareDialogOpen(true)} sx={{ color: 'white' }}>
                  <Share />
                </IconButton>
                <IconButton
                  onClick={() => onFavoriteToggle && onFavoriteToggle(media.id)}
                  sx={{ color: 'white' }}
                >
                  {media.isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
                </IconButton>
                <IconButton onClick={handleDownload} sx={{ color: 'white' }}>
                  <Download />
                </IconButton>
              </Box>
            </Box>

            <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{
                borderBottom: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                mb: 2,
                '& .MuiTab-root': { color: 'grey.400' },
                '& .Mui-selected': { color: 'white' },
              }}
            >
              <Tab icon={<Info />} label="Info" iconPosition="start" />
              <Tab icon={<CommentIcon />} label="Comments" iconPosition="start" />
            </Tabs>

            {tabValue === 0 && (
              <Box>
                {media.width && media.height && (
                  <Typography variant="body2" color="grey.400" sx={{ mb: 1 }}>
                    <strong>Dimensions:</strong> {media.width} × {media.height}
                  </Typography>
                )}
                {media.cameraMake && media.cameraModel && (
                  <Typography variant="body2" color="grey.400" sx={{ mb: 1 }}>
                    <strong>Camera:</strong> {media.cameraMake} {media.cameraModel}
                  </Typography>
                )}
                {media.latitude && media.longitude && (
                  <Typography variant="body2" color="grey.400" sx={{ mb: 2 }}>
                    <strong>Location:</strong> {media.latitude.toFixed(6)}, {media.longitude.toFixed(6)}
                  </Typography>
                )}

                <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

                <Typography variant="subtitle2" gutterBottom sx={{ color: 'grey.400' }}>
                  Tags
                </Typography>
                <TagPicker
                  mediaId={media.id}
                  selectedTags={currentTags}
                  onTagsChange={(newTags) => {
                    setCurrentTags(newTags);
                    if (onMediaUpdate && media) {
                      onMediaUpdate({ ...media, tags: newTags });
                    }
                  }}
                />
              </Box>
            )}

            {tabValue === 1 && (
              <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                <CommentSection mediaFileId={media.id} />
              </Box>
            )}
          </Box>
        </DialogContent>
      </Box>

      <ImageEditor
        open={editorOpen}
        media={media}
        onClose={() => setEditorOpen(false)}
        onEditComplete={handleEditComplete}
      />

      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        mediaFileId={media.id}
        title={media.fileName}
      />
    </Dialog>
  );
};

export default MediaViewer;
