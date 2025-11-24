import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardActionArea,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import { MediaFile, MediaType } from '@/types';
import mediaService from '@/services/mediaService';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { PlayCircleOutline } from '@mui/icons-material';

interface TimelineViewProps {
  mediaFiles: MediaFile[];
  onMediaClick: (media: MediaFile, index: number) => void;
  loading?: boolean;
}

interface GroupedMedia {
  date: Date;
  dateLabel: string;
  files: MediaFile[];
}

const TimelineView: React.FC<TimelineViewProps> = ({
  mediaFiles,
  onMediaClick,
  loading = false,
}) => {
  const [groupedMedia, setGroupedMedia] = useState<GroupedMedia[]>([]);

  useEffect(() => {
    groupMediaByDate();
  }, [mediaFiles]);

  const groupMediaByDate = () => {
    const groups: Map<string, MediaFile[]> = new Map();

    // Sort media by date (newest first)
    const sortedMedia = [...mediaFiles].sort((a, b) => {
      const dateA = a.dateTaken ? new Date(a.dateTaken) : new Date(a.createdAt);
      const dateB = b.dateTaken ? new Date(b.dateTaken) : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    // Group by date
    sortedMedia.forEach((media) => {
      const date = media.dateTaken ? parseISO(media.dateTaken) : parseISO(media.createdAt);
      const dateKey = format(date, 'yyyy-MM-dd');

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(media);
    });

    // Convert to array
    const grouped: GroupedMedia[] = Array.from(groups.entries()).map(([dateKey, files]) => {
      const date = parseISO(dateKey);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateLabel = format(date, 'MMMM d, yyyy');
      if (isSameDay(date, today)) {
        dateLabel = 'Today';
      } else if (isSameDay(date, yesterday)) {
        dateLabel = 'Yesterday';
      }

      return {
        date,
        dateLabel,
        files,
      };
    });

    setGroupedMedia(grouped);
  };

  const getThumbnailUrl = (media: MediaFile) => {
    if (media.thumbnailPath) {
      return mediaService.getThumbnailUrl(media.thumbnailPath, 300);
    }
    return mediaService.getOriginalUrl(media.filePath);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (mediaFiles.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No media files found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {groupedMedia.map((group, groupIndex) => (
        <Box key={group.date.toISOString()} sx={{ mb: 4 }}>
          {/* Date Header */}
          <Box
            sx={{
              position: 'sticky',
              top: 64,
              zIndex: 10,
              bgcolor: 'background.paper',
              py: 2,
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" fontWeight={600}>
                {group.dateLabel}
              </Typography>
              <Chip label={`${group.files.length} items`} size="small" />
            </Box>
            <Divider sx={{ mt: 1 }} />
          </Box>

          {/* Media Grid */}
          <Grid container spacing={2}>
            {group.files.map((media, index) => {
              const globalIndex = mediaFiles.findIndex((m) => m.id === media.id);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={media.id}>
                  <Card
                    sx={{
                      position: 'relative',
                      aspectRatio: '1',
                      bgcolor: 'grey.900',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        transition: 'transform 0.2s',
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => onMediaClick(media, globalIndex)}
                      sx={{ height: '100%' }}
                    >
                      <CardMedia
                        component="img"
                        image={getThumbnailUrl(media)}
                        alt={media.fileName}
                        sx={{
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />

                      {/* Video Indicator */}
                      {media.mediaType === MediaType.VIDEO && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 0.5,
                          }}
                        >
                          <PlayCircleOutline sx={{ color: 'white', fontSize: 32 }} />
                        </Box>
                      )}

                      {/* Time Display */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          bgcolor: 'rgba(0, 0, 0, 0.6)',
                          color: 'white',
                          p: 1,
                        }}
                      >
                        <Typography variant="caption">
                          {format(
                            media.dateTaken
                              ? parseISO(media.dateTaken)
                              : parseISO(media.createdAt),
                            'h:mm a'
                          )}
                        </Typography>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default TimelineView;
