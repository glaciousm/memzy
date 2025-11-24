import React, { useState } from 'react';
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
} from '@mui/material';
import { useSnackbar } from 'notistack';
import tagService from '@/services/tagService';

interface CreateTagDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const PRESET_COLORS = [
  '#f44336', // red
  '#e91e63', // pink
  '#9c27b0', // purple
  '#673ab7', // deep purple
  '#3f51b5', // indigo
  '#2196f3', // blue
  '#03a9f4', // light blue
  '#00bcd4', // cyan
  '#009688', // teal
  '#4caf50', // green
  '#8bc34a', // light green
  '#cddc39', // lime
  '#ffeb3b', // yellow
  '#ffc107', // amber
  '#ff9800', // orange
  '#ff5722', // deep orange
  '#795548', // brown
  '#607d8b', // blue grey
];

const CreateTagDialog: React.FC<CreateTagDialogProps> = ({ open, onClose, onCreated }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colorCode, setColorCode] = useState('#2196f3');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      enqueueSnackbar('Tag name is required', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      await tagService.createTag({ name, description, colorCode });
      enqueueSnackbar('Tag created successfully', { variant: 'success' });
      setName('');
      setDescription('');
      setColorCode('#2196f3');
      onCreated();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to create tag', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Tag</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            label="Tag Name"
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
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" gutterBottom>
            Tag Color
          </Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {PRESET_COLORS.map((color) => (
              <Grid item key={color}>
                <Box
                  onClick={() => setColorCode(color)}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: color,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: colorCode === color ? '3px solid' : '2px solid transparent',
                    borderColor: colorCode === color ? 'primary.main' : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                />
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Custom color:
            </Typography>
            <input
              type="color"
              value={colorCode}
              onChange={(e) => setColorCode(e.target.value)}
              style={{
                width: 50,
                height: 36,
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            />
            <Box
              sx={{
                width: 80,
                height: 36,
                bgcolor: colorCode,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          </Box>
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

export default CreateTagDialog;
