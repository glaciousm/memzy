import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Chip,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import tagService from '@/services/tagService';
import batchOperationsService from '@/services/batchOperationsService';
import { Tag } from '@/types';

interface BatchAddTagsDialogProps {
  open: boolean;
  onClose: () => void;
  mediaIds: number[];
  onComplete: () => void;
}

const BatchAddTagsDialog: React.FC<BatchAddTagsDialogProps> = ({
  open,
  onClose,
  mediaIds,
  onComplete,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) {
      loadTags();
    }
  }, [open]);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await tagService.getAllTags();
      setAllTags(data);
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load tags', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTags = async () => {
    if (selectedTags.length === 0) return;

    setAdding(true);
    try {
      const tagIds = selectedTags.map((tag) => tag.id);
      await batchOperationsService.addTagsToMedia(tagIds, mediaIds);
      enqueueSnackbar(
        `Added ${selectedTags.length} tags to ${mediaIds.length} items`,
        { variant: 'success' }
      );
      onComplete();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to add tags', { variant: 'error' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Tags to {mediaIds.length} items</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              multiple
              options={allTags}
              getOptionLabel={(option) => option.name}
              value={selectedTags}
              onChange={(_, newValue) => setSelectedTags(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Tags"
                  placeholder="Type to search..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name}
                    sx={{
                      bgcolor: option.colorHex,
                      color: 'white',
                    }}
                  />
                ))
              }
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={adding}>
          Cancel
        </Button>
        <Button
          onClick={handleAddTags}
          variant="contained"
          disabled={selectedTags.length === 0 || adding}
          startIcon={adding && <CircularProgress size={20} />}
        >
          {adding ? 'Adding...' : 'Add Tags'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchAddTagsDialog;
