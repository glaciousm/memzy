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
} from '@mui/material';
import { useSnackbar } from 'notistack';
import tagService from '@/services/tagService';
import { Tag } from '@/types';

interface EditTagDialogProps {
  open: boolean;
  tag: Tag | null;
  onClose: () => void;
  onUpdated: () => void;
}

const PRESET_COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
  '#795548', '#607d8b',
];

const EditTagDialog: React.FC<EditTagDialogProps> = ({ open, tag, onClose, onUpdated }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colorCode, setColorCode] = useState('#2196f3');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setDescription(tag.description || '');
      setColorCode(tag.colorCode || '#2196f3');
    }
  }, [tag]);

  const handleSubmit = async () => {
    if (!tag) return;

    if (!name.trim()) {
      enqueueSnackbar('Tag name is required', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      await tagService.updateTag(tag.id, name, colorCode, description);
      enqueueSnackbar('Tag updated successfully', { variant: 'success' });
      onUpdated();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to update tag', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setColorCode('#2196f3');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Tag</DialogTitle>
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

export default EditTagDialog;
