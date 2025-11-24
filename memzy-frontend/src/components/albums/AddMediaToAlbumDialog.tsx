import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Card,
  CardMedia,
  Checkbox,
  Typography,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search, PlayCircleOutline } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import albumService from '@/services/albumService';
import mediaService from '@/services/mediaService';
import { MediaFile, MediaType } from '@/types';

interface AddMediaToAlbumDialogProps {
  open: boolean;
  onClose: () => void;
  albumId: number;
  onMediaAdded: () => void;
}

const AddMediaToAlbumDialog: React.FC<AddMediaToAlbumDialogProps> = ({
  open,
  onClose,
  albumId,
  onMediaAdded,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [allMedia, setAllMedia] = useState<MediaFile[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaFile[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      loadMedia();
      setSelectedMediaIds(new Set());
      setSearchQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allMedia.filter((media) =>
        media.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMedia(filtered);
    } else {
      setFilteredMedia(allMedia);
    }
  }, [searchQuery, allMedia]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await mediaService.getUserMedia(0, 100);
      setAllMedia(response.content);
      setFilteredMedia(response.content);
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load media', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const toggleMediaSelection = (mediaId: number) => {
    const newSelection = new Set(selectedMediaIds);
    if (newSelection.has(mediaId)) {
      newSelection.delete(mediaId);
    } else {
      newSelection.add(mediaId);
    }
    setSelectedMediaIds(newSelection);
  };

  const handleAddMedia = async () => {
    if (selectedMediaIds.size === 0) {
      enqueueSnackbar('Please select at least one media file', { variant: 'warning' });
      return;
    }

    try {
      setAdding(true);
      const promises = Array.from(selectedMediaIds).map((mediaId) =>
        albumService.addMediaToAlbum(albumId, mediaId)
      );
      await Promise.all(promises);
      enqueueSnackbar(
        `${selectedMediaIds.size} media file(s) added to album`,
        { variant: 'success' }
      );
      onMediaAdded();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to add media', { variant: 'error' });
    } finally {
      setAdding(false);
    }
  };

  const getThumbnailUrl = (media: MediaFile) => {
    if (media.thumbnailPath) {
      return mediaService.getThumbnailUrl(media.thumbnailPath, 300);
    }
    return 'https://via.placeholder.com/300?text=No+Thumbnail';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Media to Album</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredMedia.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {searchQuery ? 'No media found matching your search' : 'No media available'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            <Grid container spacing={1}>
              {filteredMedia.map((media) => (
                <Grid item xs={4} sm={3} key={media.id}>
                  <Card
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      border: selectedMediaIds.has(media.id) ? 2 : 0,
                      borderColor: 'primary.main',
                    }}
                    onClick={() => toggleMediaSelection(media.id)}
                  >
                    <Box sx={{ position: 'relative', paddingTop: '100%' }}>
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
                      />
                      {media.mediaType === MediaType.VIDEO && (
                        <PlayCircleOutline
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: 'white',
                            fontSize: 40,
                            opacity: 0.9,
                          }}
                        />
                      )}
                      <Checkbox
                        checked={selectedMediaIds.has(media.id)}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          color: 'white',
                          bgcolor: 'rgba(0, 0, 0, 0.5)',
                          '&.Mui-checked': {
                            color: 'primary.main',
                            bgcolor: 'white',
                          },
                        }}
                      />
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {selectedMediaIds.size > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {selectedMediaIds.size} media file(s) selected
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={adding}>
          Cancel
        </Button>
        <Button onClick={handleAddMedia} variant="contained" disabled={adding || selectedMediaIds.size === 0}>
          {adding ? 'Adding...' : `Add ${selectedMediaIds.size || ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMediaToAlbumDialog;
