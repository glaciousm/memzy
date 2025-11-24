import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Pagination, Badge } from '@mui/material';
import { CloudUpload, FilterList } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import MainLayout from '@/components/layout/MainLayout';
import MediaGrid from '@/components/media/MediaGrid';
import MediaUpload from '@/components/media/MediaUpload';
import MediaViewer from '@/components/media/MediaViewer';
import SearchFilterPanel, { SearchFilters } from '@/components/search/SearchFilterPanel';
import mediaService from '@/services/mediaService';
import { MediaFile } from '@/types';

const GalleryPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState<SearchFilters>({
    mediaType: 'ALL',
    tagIds: [],
    startDate: null,
    endDate: null,
    favorites: null,
  });

  const hasActiveFilters =
    filters.mediaType !== 'ALL' ||
    filters.tagIds.length > 0 ||
    filters.startDate !== null ||
    filters.endDate !== null ||
    filters.favorites !== null;

  const loadMedia = async () => {
    try {
      setLoading(true);

      if (hasActiveFilters) {
        const response = await mediaService.searchMedia({
          mediaType: filters.mediaType !== 'ALL' ? filters.mediaType : undefined,
          tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
          startDate: filters.startDate,
          endDate: filters.endDate,
          isFavorite: filters.favorites,
          page,
          size: 20,
        });
        setMediaFiles(response.content);
        setTotalPages(response.totalPages);
      } else {
        const response = await mediaService.getUserMedia(page, 20);
        setMediaFiles(response.content);
        setTotalPages(response.totalPages);
      }
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load media', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [page]);

  const handleApplyFilters = () => {
    setPage(0);
    loadMedia();
  };

  const handleResetFilters = () => {
    setFilters({
      mediaType: 'ALL',
      tagIds: [],
      startDate: null,
      endDate: null,
      favorites: null,
    });
    setPage(0);
    setTimeout(() => loadMedia(), 100);
  };

  const handleMediaClick = (media: MediaFile) => {
    const index = mediaFiles.findIndex((m) => m.id === media.id);
    setSelectedMedia(media);
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  const handleFavoriteToggle = async (id: number) => {
    try {
      await mediaService.toggleFavorite(id);
      setMediaFiles((prev) =>
        prev.map((media) =>
          media.id === id ? { ...media, isFavorite: !media.isFavorite } : media
        )
      );
      enqueueSnackbar('Favorite toggled', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar('Failed to toggle favorite', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this media?')) {
      try {
        await mediaService.deleteMedia(id);
        setMediaFiles((prev) => prev.filter((media) => media.id !== id));
        enqueueSnackbar('Media deleted', { variant: 'success' });
      } catch (error: any) {
        enqueueSnackbar('Failed to delete media', { variant: 'error' });
      }
    }
  };

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedMedia(mediaFiles[newIndex]);
      setSelectedIndex(newIndex);
    }
  };

  const handleNext = () => {
    if (selectedIndex < mediaFiles.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedMedia(mediaFiles[newIndex]);
      setSelectedIndex(newIndex);
    }
  };

  return (
    <MainLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight={600}>
            Gallery
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Badge
              color="primary"
              variant="dot"
              invisible={!hasActiveFilters}
            >
              <Button
                variant={hasActiveFilters ? 'contained' : 'outlined'}
                startIcon={<FilterList />}
                onClick={() => setFilterPanelOpen(true)}
              >
                Filters
              </Button>
            </Badge>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => setUploadOpen(true)}
            >
              Upload Media
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : mediaFiles.length === 0 ? (
          <Paper
            sx={{
              p: 8,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <CloudUpload sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No media files yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Upload your photos and videos to get started
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<CloudUpload />}
              onClick={() => setUploadOpen(true)}
            >
              Upload Files
            </Button>
          </Paper>
        ) : (
          <>
            <MediaGrid
              mediaFiles={mediaFiles}
              onMediaClick={handleMediaClick}
              onFavoriteToggle={handleFavoriteToggle}
              onDelete={handleDelete}
            />

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={(_, newPage) => setPage(newPage - 1)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}

        <MediaUpload
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUploadComplete={loadMedia}
        />

        <MediaViewer
          open={viewerOpen}
          media={selectedMedia}
          onClose={() => setViewerOpen(false)}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onFavoriteToggle={handleFavoriteToggle}
          hasPrevious={selectedIndex > 0}
          hasNext={selectedIndex < mediaFiles.length - 1}
        />

        <SearchFilterPanel
          open={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />
      </Box>
    </MainLayout>
  );
};

export default GalleryPage;
