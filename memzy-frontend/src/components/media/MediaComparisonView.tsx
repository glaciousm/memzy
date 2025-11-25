import React, { useState } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  Close,
  SwapHoriz,
  Delete,
  Favorite,
  FavoriteBorder,
  Info,
} from '@mui/icons-material';
import { MediaFile, MediaType } from '@/types';
import mediaService from '@/services/mediaService';
import { format, parseISO } from 'date-fns';

interface MediaComparisonViewProps {
  open: boolean;
  media1: MediaFile;
  media2: MediaFile;
  onClose: () => void;
  onDelete?: (mediaId: number) => void;
  onFavoriteToggle?: (mediaId: number) => void;
}

const MediaComparisonView: React.FC<MediaComparisonViewProps> = ({
  open,
  media1,
  media2,
  onClose,
  onDelete,
  onFavoriteToggle,
}) => {
  const [leftMedia, setLeftMedia] = useState(media1);
  const [rightMedia, setRightMedia] = useState(media2);

  const handleSwap = () => {
    setLeftMedia(rightMedia);
    setRightMedia(leftMedia);
  };

  const getMediaUrl = (media: MediaFile) => {
    return mediaService.getOriginalUrl(media.filePath);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const renderMediaContent = (media: MediaFile) => {
    if (media.mediaType === MediaType.VIDEO) {
      return (
        <video
          src={getMediaUrl(media)}
          controls
          style={{
            maxWidth: '100%',
            maxHeight: '60vh',
            objectFit: 'contain',
          }}
        />
      );
    }

    return (
      <img
        src={getMediaUrl(media)}
        alt={media.fileName}
        style={{
          maxWidth: '100%',
          maxHeight: '60vh',
          objectFit: 'contain',
        }}
      />
    );
  };

  const renderMetadata = (media: MediaFile) => {
    return (
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell><strong>File Name</strong></TableCell>
            <TableCell>{media.fileName}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><strong>File Size</strong></TableCell>
            <TableCell>{formatFileSize(media.fileSize)}</TableCell>
          </TableRow>
          {media.width && media.height && (
            <TableRow>
              <TableCell><strong>Dimensions</strong></TableCell>
              <TableCell>{media.width} × {media.height}</TableCell>
            </TableRow>
          )}
          {media.duration && (
            <TableRow>
              <TableCell><strong>Duration</strong></TableCell>
              <TableCell>{media.duration}s</TableCell>
            </TableRow>
          )}
          {media.cameraMake && (
            <TableRow>
              <TableCell><strong>Camera</strong></TableCell>
              <TableCell>{media.cameraMake} {media.cameraModel}</TableCell>
            </TableRow>
          )}
          {media.dateTaken && (
            <TableRow>
              <TableCell><strong>Date Taken</strong></TableCell>
              <TableCell>{format(parseISO(media.dateTaken), 'MMM d, yyyy h:mm a')}</TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell><strong>Created</strong></TableCell>
            <TableCell>{format(parseISO(media.createdAt), 'MMM d, yyyy h:mm a')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><strong>View Count</strong></TableCell>
            <TableCell>{media.viewCount}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><strong>Favorite</strong></TableCell>
            <TableCell>{media.isFavorite ? 'Yes' : 'No'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  };

  const getDifferences = () => {
    const diffs = [];

    if (leftMedia.fileSize !== rightMedia.fileSize) {
      const diff = Math.abs(leftMedia.fileSize - rightMedia.fileSize);
      diffs.push({
        field: 'File Size',
        difference: formatFileSize(diff),
        larger: leftMedia.fileSize > rightMedia.fileSize ? 'left' : 'right',
      });
    }

    if (leftMedia.width && rightMedia.width && leftMedia.width !== rightMedia.width) {
      diffs.push({
        field: 'Width',
        difference: Math.abs(leftMedia.width - rightMedia.width) + 'px',
        larger: leftMedia.width > rightMedia.width ? 'left' : 'right',
      });
    }

    if (leftMedia.height && rightMedia.height && leftMedia.height !== rightMedia.height) {
      diffs.push({
        field: 'Height',
        difference: Math.abs(leftMedia.height - rightMedia.height) + 'px',
        larger: leftMedia.height > rightMedia.height ? 'left' : 'right',
      });
    }

    if (leftMedia.dateTaken && rightMedia.dateTaken) {
      const date1 = new Date(leftMedia.dateTaken).getTime();
      const date2 = new Date(rightMedia.dateTaken).getTime();
      if (date1 !== date2) {
        const diffMs = Math.abs(date1 - date2);
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        diffs.push({
          field: 'Date Taken',
          difference: `${diffDays} days`,
          larger: date1 > date2 ? 'left' : 'right',
        });
      }
    }

    return diffs;
  };

  const differences = getDifferences();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Media Comparison</Typography>
          <Box>
            <IconButton onClick={handleSwap} sx={{ mr: 1 }}>
              <SwapHoriz />
            </IconButton>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Comparison Grid */}
        <Grid container spacing={3}>
          {/* Left Media */}
          <Grid item xs={12} md={6}>
            <Card>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h6">Media A</Typography>
              </Box>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, bgcolor: 'grey.100' }}>
                {renderMediaContent(leftMedia)}
              </Box>
              <CardContent>
                {renderMetadata(leftMedia)}
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  {onFavoriteToggle && (
                    <Button
                      startIcon={leftMedia.isFavorite ? <Favorite /> : <FavoriteBorder />}
                      onClick={() => onFavoriteToggle(leftMedia.id)}
                      size="small"
                    >
                      {leftMedia.isFavorite ? 'Unfavorite' : 'Favorite'}
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      startIcon={<Delete />}
                      onClick={() => onDelete(leftMedia.id)}
                      color="error"
                      size="small"
                    >
                      Delete
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Media */}
          <Grid item xs={12} md={6}>
            <Card>
              <Box sx={{ p: 2, bgcolor: 'secondary.main', color: 'white' }}>
                <Typography variant="h6">Media B</Typography>
              </Box>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, bgcolor: 'grey.100' }}>
                {renderMediaContent(rightMedia)}
              </Box>
              <CardContent>
                {renderMetadata(rightMedia)}
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  {onFavoriteToggle && (
                    <Button
                      startIcon={rightMedia.isFavorite ? <Favorite /> : <FavoriteBorder />}
                      onClick={() => onFavoriteToggle(rightMedia.id)}
                      size="small"
                    >
                      {rightMedia.isFavorite ? 'Unfavorite' : 'Favorite'}
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      startIcon={<Delete />}
                      onClick={() => onDelete(rightMedia.id)}
                      color="error"
                      size="small"
                    >
                      Delete
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Differences */}
        {differences.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Key Differences
            </Typography>
            <Grid container spacing={2}>
              {differences.map((diff, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        {diff.field}
                      </Typography>
                      <Typography variant="h6">{diff.difference}</Typography>
                      <Chip
                        label={`${diff.larger === 'left' ? 'A' : 'B'} is larger`}
                        size="small"
                        color={diff.larger === 'left' ? 'primary' : 'secondary'}
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {differences.length === 0 && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
              These files appear to be identical or very similar
            </Typography>
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default MediaComparisonView;
