import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Paper } from '@mui/material';
import { PhotoLibrary, Collections, FolderOpen, Star } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';

const DashboardPage: React.FC = () => {
  const stats = [
    { title: 'Total Media', value: '0', icon: <PhotoLibrary fontSize="large" />, color: '#6366f1' },
    { title: 'Albums', value: '0', icon: <Collections fontSize="large" />, color: '#ec4899' },
    { title: 'Folders', value: '0', icon: <FolderOpen fontSize="large" />, color: '#10b981' },
    { title: 'Favorites', value: '0', icon: <Star fontSize="large" />, color: '#f59e0b' },
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

        <Grid container spacing={3}>
          {stats.map((stat, index) => (
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
