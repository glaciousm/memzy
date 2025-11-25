import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardActionArea,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Check, Close, ImageNotSupported } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import albumService from '@/services/albumService';
import { Album, MediaFile } from '@/types';

interface EditAlbumDialogProps {
  open: boolean;
  album: Album | null;
  onClose: () => void;
  onUpdated: () => void;
}

const EditAlbumDialog: React.FC<EditAlbumDialogProps> = ({ open, album, onClose, onUpdated }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [albumMedia, setAlbumMedia] = useState<MediaFile[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [selectedCoverId, setSelectedCoverId] = useState<number | null>(null);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  useEffect(() => {
    if (album) {
      setName(album.name);
      setDescription(album.description || '');
      setSelectedCoverId(null);
      setShowCoverPicker(false);
    }
  }, [album]);

  useEffect(() => {
    if (open && album && showCoverPicker) {
      loadAlbumMedia();
    }
  }, [open, album, showCoverPicker]);

  const loadAlbumMedia = async () => {
    if (!album) return;
    try {
      setLoadingMedia(true);
      const media = await albumService.getAlbumMedia(album.id);
      setAlbumMedia(media);
    } catch (error: any) {
      enqueueSnackbar('Failed to load album media', { variant: 'error' });
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleSubmit = async () => {
    if (!album) return;

    if (!name.trim()) {
      enqueueSnackbar('Album name is required', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);

      // Update album details
      await albumService.updateAlbum(album.id, name, description);

      // Update cover if selected
      if (selectedCoverId !== null) {
        await albumService.setAlbumCover(album.id, selectedCoverId);
      }

      enqueueSnackbar('Album updated successfully', { variant: 'success' });
      onUpdated();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to update album', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!album) return;

    try {
      setLoading(true);
      await albumService.removeAlbumCover(album.id);
      enqueueSnackbar('Cover image removed', { variant: 'success' });
      onUpdated();
    } catch (error: any) {
      enqueueSnackbar('Failed to remove cover', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedCoverId(null);
    setShowCoverPicker(false);
    setAlbumMedia([]);
    onClose();
  };

  const getThumbnailUrl = (media: MediaFile) => {
    return `/api/files/thumbnails/${media.id}/small`;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Album</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            label="Album Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 3 }}
          />

          {/* Cover Image Section */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={500}>
                Cover Image
              </Typography>
              <Box>
                {album?.coverImageUrl && (
                  <Button
                    size="small"
                    color="error"
                    onClick={handleRemoveCover}
                    disabled={loading}
                    sx={{ mr: 1 }}
                  >
                    Remove Cover
                  </Button>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setShowCoverPicker(!showCoverPicker)}
                >
                  {showCoverPicker ? 'Hide Picker' : 'Change Cover'}
                </Button>
              </Box>
            </Box>

            {/* Current Cover Preview */}
            {album?.coverImageUrl && !showCoverPicker && (
              <Box
                sx={{
                  width: 150,
                  height: 100,
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: 'background.default',
                }}
              >
                <img
                  src={album.coverImageUrl}
                  alt="Current cover"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            )}

            {/* Cover Image Picker */}
            {showCoverPicker && (
              <Box sx={{ mt: 2 }}>
                {loadingMedia ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : albumMedia.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <ImageNotSupported sx={{ fontSize: 48, mb: 1 }} />
                    <Typography>No media in this album</Typography>
                    <Typography variant="body2">Add media to the album to set a cover</Typography>
                  </Box>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Select an image to use as the album cover:
                    </Typography>
                    <Grid container spacing={1} sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {albumMedia
                        .filter(media => media.mediaType === 'IMAGE')
                        .map((media) => (
                          <Grid item xs={4} sm={3} md={2} key={media.id}>
                            <Card
                              sx={{
                                position: 'relative',
                                border: selectedCoverId === media.id ? '3px solid' : '3px solid transparent',
                                borderColor: selectedCoverId === media.id ? 'primary.main' : 'transparent',
                                borderRadius: 1,
                              }}
                            >
                              <CardActionArea onClick={() => setSelectedCoverId(media.id)}>
                                <CardMedia
                                  component="img"
                                  height="80"
                                  image={getThumbnailUrl(media)}
                                  alt={media.fileName}
                                  sx={{ objectFit: 'cover' }}
                                />
                                {selectedCoverId === media.id && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      bgcolor: 'primary.main',
                                      borderRadius: '50%',
                                      p: 0.25,
                                    }}
                                  >
                                    <Check sx={{ fontSize: 16, color: 'white' }} />
                                  </Box>
                                )}
                              </CardActionArea>
                            </Card>
                          </Grid>
                        ))}
                    </Grid>
                    {selectedCoverId && (
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="primary">
                          New cover selected
                        </Typography>
                        <Tooltip title="Clear selection">
                          <IconButton size="small" onClick={() => setSelectedCoverId(null)}>
                            <Close fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditAlbumDialog;
