import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import {
  Close,
  ChevronLeft,
  ChevronRight,
  Favorite,
  FavoriteBorder,
  Download,
} from '@mui/icons-material';
import ReactPlayer from 'react-player';
import { MediaFile, MediaType, Tag } from '@/types';
import mediaService from '@/services/mediaService';
import TagPicker from '@/components/tags/TagPicker';
import { format } from 'date-fns';

interface MediaViewerProps {
  open: boolean;
  media: MediaFile | null;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onFavoriteToggle?: (id: number) => void;
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
  hasPrevious = false,
  hasNext = false,
}) => {
  const [currentTags, setCurrentTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (media) {
      setCurrentTags(media.tags);
    }
  }, [media]);

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
                {media.width && media.height && (
                  <Typography variant="caption" color="grey.500">
                    {media.width} × {media.height}
                  </Typography>
                )}
                {media.cameraMake && media.cameraModel && (
                  <Typography variant="caption" color="grey.500" sx={{ display: 'block' }}>
                    {media.cameraMake} {media.cameraModel}
                  </Typography>
                )}
              </Box>

              <Box>
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
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'grey.400' }}>
                Tags
              </Typography>
              <TagPicker
                mediaId={media.id}
                selectedTags={currentTags}
                onTagsChange={setCurrentTags}
              />
            </Box>
          </Box>
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default MediaViewer;
