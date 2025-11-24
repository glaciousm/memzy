import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import albumService from '@/services/albumService';
import batchOperationsService from '@/services/batchOperationsService';
import { Album } from '@/types';

interface BatchAddToAlbumDialogProps {
  open: boolean;
  onClose: () => void;
  mediaIds: number[];
  onComplete: () => void;
}

const BatchAddToAlbumDialog: React.FC<BatchAddToAlbumDialogProps> = ({
  open,
  onClose,
  mediaIds,
  onComplete,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      loadAlbums();
    }
  }, [open]);

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

  const handleAddToAlbum = async () => {
    if (!selectedAlbumId) return;

    setAdding(true);
    try {
      await batchOperationsService.addToAlbum(selectedAlbumId, mediaIds);
      enqueueSnackbar(`Added ${mediaIds.length} items to album`, { variant: 'success' });
      onComplete();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to add to album', { variant: 'error' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add {mediaIds.length} items to Album</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : albums.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No albums found. Create an album first.
          </Typography>
        ) : (
          <List>
            {albums.map((album) => (
              <ListItem key={album.id} disablePadding>
                <ListItemButton
                  selected={selectedAlbumId === album.id}
                  onClick={() => setSelectedAlbumId(album.id)}
                >
                  <ListItemText
                    primary={album.name}
                    secondary={album.description}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={adding}>
          Cancel
        </Button>
        <Button
          onClick={handleAddToAlbum}
          variant="contained"
          disabled={!selectedAlbumId || adding}
          startIcon={adding && <CircularProgress size={20} />}
        >
          {adding ? 'Adding...' : 'Add to Album'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchAddToAlbumDialog;
