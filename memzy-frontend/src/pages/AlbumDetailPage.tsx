import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  IconButton,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import { Add, ArrowBack, Edit, Folder } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate, useParams, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import MediaGrid from '@/components/media/MediaGrid';
import MediaViewer from '@/components/media/MediaViewer';
import albumService from '@/services/albumService';
import mediaService from '@/services/mediaService';
import { Album, MediaFile } from '@/types';
import AddMediaToAlbumDialog from '@/components/albums/AddMediaToAlbumDialog';

const AlbumDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [album, setAlbum] = useState<Album | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [addMediaDialogOpen, setAddMediaDialogOpen] = useState(false);

  const loadAlbum = async () => {
    if (!id) return;
    try {
      const albumData = await albumService.getAlbumById(Number(id));
      setAlbum(albumData);
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load album', { variant: 'error' });
      navigate('/albums');
    }
  };

  const loadMedia = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await albumService.getAlbumMedia(Number(id));
      setMediaFiles(data);
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load media', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbum();
    loadMedia();
  }, [id]);

  const handleMediaClick = (media: MediaFile) => {
    const index = mediaFiles.findIndex((m) => m.id === media.id);
    setSelectedMedia(media);
    setSelectedMediaIndex(index);
    setViewerOpen(true);
  };

  const handleFavoriteToggle = async (mediaId: number) => {
    try {
      await mediaService.toggleFavorite(mediaId);
      setMediaFiles(
        mediaFiles.map((m) =>
          m.id === mediaId ? { ...m, isFavorite: !m.isFavorite } : m
        )
      );
      if (selectedMedia?.id === mediaId) {
        setSelectedMedia({ ...selectedMedia, isFavorite: !selectedMedia.isFavorite });
      }
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to update favorite', { variant: 'error' });
    }
  };

  const handleDelete = async (mediaId: number) => {
    if (!id) return;
    if (window.confirm('Remove this media from the album?')) {
      try {
        await albumService.removeMediaFromAlbum(Number(id), mediaId);
        setMediaFiles(mediaFiles.filter((m) => m.id !== mediaId));
        enqueueSnackbar('Media removed from album', { variant: 'success' });
        if (album) {
          setAlbum({ ...album, mediaCount: (album.mediaCount || 1) - 1 });
        }
      } catch (error: any) {
        enqueueSnackbar(error.message || 'Failed to remove media', { variant: 'error' });
      }
    }
  };

  const handlePrevious = () => {
    if (selectedMediaIndex > 0) {
      const newIndex = selectedMediaIndex - 1;
      setSelectedMedia(mediaFiles[newIndex]);
      setSelectedMediaIndex(newIndex);
    }
  };

  const handleNext = () => {
    if (selectedMediaIndex < mediaFiles.length - 1) {
      const newIndex = selectedMediaIndex + 1;
      setSelectedMedia(mediaFiles[newIndex]);
      setSelectedMediaIndex(newIndex);
    }
  };

  const handleMediaAdded = () => {
    loadMedia();
    loadAlbum();
  };

  if (!album) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box>
        <Breadcrumbs sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/albums" underline="hover" color="inherit">
            Albums
          </MuiLink>
          <Typography color="text.primary">{album.name}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/albums')}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight={600}>
                {album.name}
              </Typography>
              {album.description && (
                <Typography variant="body1" color="text.secondary">
                  {album.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {mediaFiles.length} items
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<Edit />}>
              Edit Album
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddMediaDialogOpen(true)}
            >
              Add Media
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : mediaFiles.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <Folder sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No media in this album yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Add photos and videos to organize your memories
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => setAddMediaDialogOpen(true)}
            >
              Add Media
            </Button>
          </Paper>
        ) : (
          <MediaGrid
            mediaFiles={mediaFiles}
            onMediaClick={handleMediaClick}
            onFavoriteToggle={handleFavoriteToggle}
            onDelete={handleDelete}
          />
        )}

        <MediaViewer
          open={viewerOpen}
          media={selectedMedia}
          onClose={() => setViewerOpen(false)}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onFavoriteToggle={handleFavoriteToggle}
          hasPrevious={selectedMediaIndex > 0}
          hasNext={selectedMediaIndex < mediaFiles.length - 1}
        />

        <AddMediaToAlbumDialog
          open={addMediaDialogOpen}
          onClose={() => setAddMediaDialogOpen(false)}
          albumId={Number(id)}
          onMediaAdded={handleMediaAdded}
        />
      </Box>
    </MainLayout>
  );
};

export default AlbumDetailPage;
