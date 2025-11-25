import React from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardActions,
  IconButton,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Delete,
  PlayCircleOutline,
  Visibility,
} from '@mui/icons-material';
import { MediaFile, MediaType } from '@/types';
import mediaService from '@/services/mediaService';
import { format } from 'date-fns';

interface MediaGridProps {
  mediaFiles: MediaFile[];
  onMediaClick: (media: MediaFile) => void;
  onFavoriteToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

const MediaGrid: React.FC<MediaGridProps> = ({
  mediaFiles,
  onMediaClick,
  onFavoriteToggle,
  onDelete,
}) => {
  const getThumbnailUrl = (media: MediaFile) => {
    if (media.thumbnailPath) {
      return mediaService.getThumbnailUrl(media.thumbnailPath, 600);
    }
    return 'https://via.placeholder.com/600?text=No+Thumbnail';
  };

  return (
    <Grid container spacing={2}>
      {mediaFiles.map((media) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={media.id}>
          <Card
            sx={{
              position: 'relative',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
                '& .media-overlay': {
                  opacity: 1,
                },
              },
            }}
          >
            <Box sx={{ position: 'relative', paddingTop: '100%', bgcolor: 'background.default' }}>
              <CardMedia
                component="img"
                image={getThumbnailUrl(media)}
                alt={media.fileName}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onClick={() => onMediaClick(media)}
              />

              {media.mediaType === MediaType.VIDEO && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    pointerEvents: 'none',
                  }}
                >
                  <PlayCircleOutline sx={{ fontSize: 60, opacity: 0.9 }} />
                </Box>
              )}

              {media.isFavorite && (
                <Favorite
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: 'error.main',
                  }}
                />
              )}

              {/* Tags displayed on thumbnail */}
              {media.tags && media.tags.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.5,
                    maxWidth: '70%',
                  }}
                >
                  {media.tags.slice(0, 3).map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        bgcolor: tag.colorCode || 'primary.main',
                        color: 'white',
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                  ))}
                  {media.tags.length > 3 && (
                    <Chip
                      label={`+${media.tags.length - 3}`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                      }}
                    />
                  )}
                </Box>
              )}

              <Box
                className="media-overlay"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  p: 1,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
              >
                <Typography variant="caption" noWrap>
                  {media.fileName}
                </Typography>
                <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                  {media.dateTaken
                    ? format(new Date(media.dateTaken), 'MMM d, yyyy')
                    : format(new Date(media.createdAt), 'MMM d, yyyy')}
                </Typography>
                {media.tags.length > 0 && (
                  <Box sx={{ mt: 0.5 }}>
                    {media.tags.slice(0, 2).map((tag) => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          mr: 0.5,
                          bgcolor: tag.colorCode || 'primary.main',
                          color: 'white',
                        }}
                      />
                    ))}
                    {media.tags.length > 2 && (
                      <Typography variant="caption" component="span">
                        +{media.tags.length - 2}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Box>

            <CardActions sx={{ justifyContent: 'space-between', px: 1 }}>
              <Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavoriteToggle(media.id);
                  }}
                >
                  {media.isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMediaClick(media);
                  }}
                >
                  <Visibility />
                </IconButton>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(media.id);
                }}
              >
                <Delete />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default MediaGrid;
