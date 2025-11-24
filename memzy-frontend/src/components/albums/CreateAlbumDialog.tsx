import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import albumService from '@/services/albumService';

interface CreateAlbumDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CreateAlbumDialog: React.FC<CreateAlbumDialogProps> = ({ open, onClose, onCreated }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      enqueueSnackbar('Album name is required', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      await albumService.createAlbum(name, description);
      enqueueSnackbar('Album created successfully', { variant: 'success' });
      setName('');
      setDescription('');
      onCreated();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to create album', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Album</DialogTitle>
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
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAlbumDialog;
