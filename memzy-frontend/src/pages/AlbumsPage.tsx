import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  CircularProgress,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import { Add, MoreVert, Edit, Delete, Folder, Image } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import CreateAlbumDialog from '@/components/albums/CreateAlbumDialog';
import EditAlbumDialog from '@/components/albums/EditAlbumDialog';
import albumService from '@/services/albumService';
import { Album } from '@/types';

const AlbumsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      const data = await albumService.getUserAlbums();
      setAlbums(data);
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load albums', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, album: Album) => {
    setAnchorEl(event.currentTarget);
    setSelectedAlbum(album);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAlbum(null);
  };

  const handleEditAlbum = () => {
    setEditDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteAlbum = async () => {
    if (!selectedAlbum) return;

    if (window.confirm(`Are you sure you want to delete "${selectedAlbum.name}"?`)) {
      try {
        await albumService.deleteAlbum(selectedAlbum.id);
        enqueueSnackbar('Album deleted successfully', { variant: 'success' });
        loadAlbums();
      } catch (error: any) {
        enqueueSnackbar('Failed to delete album', { variant: 'error' });
      }
    }
    handleMenuClose();
  };

  return (
    <MainLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight={600}>
            Albums
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Album
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : albums.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <Folder sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No albums yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Create albums to organize your media files
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Your First Album
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {albums.map((album) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={album.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardMedia
                    component="div"
                    onClick={() => navigate(`/albums/${album.id}`)}
                    sx={{
                      height: 200,
                      bgcolor: 'background.default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {album.coverImageUrl ? (
                      <img
                        src={album.coverImageUrl}
                        alt={album.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Folder sx={{ fontSize: 80, color: 'text.secondary' }} />
                    )}
                  </CardMedia>
                  <CardContent onClick={() => navigate(`/albums/${album.id}`)}>
                    <Typography variant="h6" noWrap>
                      {album.name}
                    </Typography>
                    {album.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {album.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {album.mediaCount || 0} items
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end' }}>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, album)}>
                      <MoreVert />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <CreateAlbumDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onCreated={loadAlbums}
        />

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleEditAlbum}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleDeleteAlbum}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        <EditAlbumDialog
          open={editDialogOpen}
          album={selectedAlbum}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedAlbum(null);
          }}
          onUpdated={loadAlbums}
        />
      </Box>
    </MainLayout>
  );
};

export default AlbumsPage;
