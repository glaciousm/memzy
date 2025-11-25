import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Chip,
  IconButton,
  CardMedia,
  Checkbox,
  Alert,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Refresh,
  Delete,
  Info,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import duplicateFinderService, { DuplicateStats } from '@/services/duplicateFinderService';
import mediaService from '@/services/mediaService';
import { MediaFile } from '@/types';

const DuplicateFinderView: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DuplicateStats | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<Record<string, MediaFile[]>>({});
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<number>>(new Set());
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await duplicateFinderService.getStats();
      setStats(data);
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load duplicate stats', { variant: 'error' });
    }
  };

  const findDuplicates = async (method: 'hash' | 'size' | 'name' | 'dimensions') => {
    setLoading(true);
    setSelectedForDeletion(new Set());

    try {
      let result;
      switch (method) {
        case 'hash':
          result = await duplicateFinderService.findByHash();
          setDuplicateGroups(result.duplicateGroups);
          break;
        case 'size':
          result = await duplicateFinderService.findBySize();
          setDuplicateGroups(result.duplicateGroups);
          break;
        case 'name':
          result = await duplicateFinderService.findByName(0.8);
          // Convert array format to object format
          const groupsByName: Record<string, MediaFile[]> = {};
          result.similarGroups.forEach((group: MediaFile[], index: number) => {
            groupsByName[`group_${index}`] = group;
          });
          setDuplicateGroups(groupsByName);
          break;
        case 'dimensions':
          result = await duplicateFinderService.findByDimensions();
          setDuplicateGroups(result.duplicateGroups);
          break;
      }

      enqueueSnackbar(`Found ${Object.keys(duplicateGroups).length} duplicate groups`, { variant: 'success' });
      loadStats();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to find duplicates', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (mediaId: number) => {
    const newSelected = new Set(selectedForDeletion);
    if (newSelected.has(mediaId)) {
      newSelected.delete(mediaId);
    } else {
      newSelected.add(mediaId);
    }
    setSelectedForDeletion(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedForDeletion.size === 0) {
      enqueueSnackbar('No files selected for deletion', { variant: 'warning' });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedForDeletion.size} files?`)) {
      return;
    }

    try {
      // Delete selected files
      await Promise.all(
        Array.from(selectedForDeletion).map((id) => mediaService.deleteMedia(id))
      );

      enqueueSnackbar(`Deleted ${selectedForDeletion.size} files`, { variant: 'success' });

      // Refresh the current view
      setSelectedForDeletion(new Set());
      if (tabValue === 0) {
        await findDuplicates('hash');
      }
      await loadStats();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to delete files', { variant: 'error' });
    }
  };

  const getThumbnailUrl = (media: MediaFile) => {
    if (media.thumbnailPath) {
      return mediaService.getThumbnailUrl(media.thumbnailPath, 300);
    }
    return mediaService.getOriginalUrl(media.filePath);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Duplicate Media Finder
      </Typography>

      {/* Stats */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {stats.duplicateGroups}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duplicate Groups
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {stats.totalDuplicateFiles}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duplicate Files
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {stats.totalWastedSpaceMB} MB
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Wasted Space
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={loadStats}
                  fullWidth
                >
                  Refresh Stats
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Scan Options */}
      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab label="By Hash (Exact)" />
        <Tab label="By Size" />
        <Tab label="By Name" />
        <Tab label="By Dimensions" />
      </Tabs>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          onClick={() => {
            const methods = ['hash', 'size', 'name', 'dimensions'] as const;
            findDuplicates(methods[tabValue]);
          }}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
        >
          {loading ? 'Scanning...' : 'Find Duplicates'}
        </Button>

        {selectedForDeletion.size > 0 && (
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSelected}
            startIcon={<Delete />}
          >
            Delete Selected ({selectedForDeletion.size})
          </Button>
        )}
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Tip:</strong> Select files you want to keep unselected. Keep one copy and delete the rest to free up space.
        </Typography>
      </Alert>

      {/* Duplicate Groups */}
      {Object.keys(duplicateGroups).length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
          {loading ? 'Scanning for duplicates...' : 'Click "Find Duplicates" to scan your media library'}
        </Typography>
      ) : (
        <Box>
          {Object.entries(duplicateGroups).map(([key, files], groupIndex) => (
            <Card key={key} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Group {groupIndex + 1} ({files.length} files)
                  </Typography>
                  <Chip
                    label={`Wasted: ${formatFileSize(files[0].fileSize * (files.length - 1))}`}
                    color="error"
                    size="small"
                  />
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  {files.map((media) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={media.id}>
                      <Card
                        sx={{
                          position: 'relative',
                          border: selectedForDeletion.has(media.id) ? '2px solid' : '1px solid',
                          borderColor: selectedForDeletion.has(media.id) ? 'error.main' : 'divider',
                        }}
                      >
                        <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
                          <Checkbox
                            checked={selectedForDeletion.has(media.id)}
                            onChange={() => handleToggleSelect(media.id)}
                            sx={{
                              bgcolor: 'rgba(255, 255, 255, 0.8)',
                              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                            }}
                          />
                        </Box>

                        <CardMedia
                          component="img"
                          height="200"
                          image={getThumbnailUrl(media)}
                          alt={media.fileName}
                          sx={{ objectFit: 'cover' }}
                        />

                        <CardContent>
                          <Typography variant="body2" noWrap title={media.fileName}>
                            {media.fileName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Size: {formatFileSize(media.fileSize)}
                          </Typography>
                          {media.width && media.height && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {media.width} × {media.height}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary" display="block">
                            {new Date(media.createdAt).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default DuplicateFinderView;
