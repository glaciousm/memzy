import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Paper, CircularProgress } from '@mui/material';
import { PhotoLibrary, Photo, Videocam, Star } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import MainLayout from '@/components/layout/MainLayout';
import mediaService, { StorageStats } from '@/services/mediaService';

const DashboardPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await mediaService.getStorageStats();
        setStats(data);
      } catch (error: any) {
        enqueueSnackbar(error.message || 'Failed to load dashboard stats', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total Media',
      value: stats?.totalFiles?.toString() || '0',
      icon: <PhotoLibrary fontSize="large" />,
      color: '#6366f1'
    },
    {
      title: 'Images',
      value: stats?.imageCount?.toString() || '0',
      icon: <Photo fontSize="large" />,
      color: '#10b981'
    },
    {
      title: 'Videos',
      value: stats?.videoCount?.toString() || '0',
      icon: <Videocam fontSize="large" />,
      color: '#ec4899'
    },
    {
      title: 'Favorites',
      value: stats?.favoriteCount?.toString() || '0',
      icon: <Star fontSize="large" />,
      color: '#f59e0b'
    },
  ];

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Welcome Back!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Here's an overview of your media library
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {statCards.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            bgcolor: stat.color,
                            color: 'white',
                            borderRadius: 2,
                            p: 1,
                            display: 'flex',
                            mr: 2,
                          }}
                        >
                          {stat.icon}
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {stat.title}
                          </Typography>
                          <Typography variant="h4" fontWeight={600}>
                            {stat.value}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {stats && (
              <Box sx={{ mt: 3 }}>
                <Paper sx={{ p: 2, display: 'inline-block' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Storage Used: <strong>{stats.totalSizeFormatted}</strong>
                  </Typography>
                </Paper>
              </Box>
            )}
          </>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Recent Activity
          </Typography>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No recent activity yet. Start uploading your media files!
            </Typography>
          </Paper>
        </Box>
      </Box>
    </MainLayout>
  );
};

export default DashboardPage;
