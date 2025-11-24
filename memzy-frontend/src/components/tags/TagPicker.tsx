import React, { useState, useEffect } from 'react';
import {
  Box,
  Autocomplete,
  TextField,
  CircularProgress,
  Button,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import tagService from '@/services/tagService';
import { Tag } from '@/types';
import TagChip from './TagChip';
import CreateTagDialog from './CreateTagDialog';

interface TagPickerProps {
  mediaId: number;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

const TagPicker: React.FC<TagPickerProps> = ({ mediaId, selectedTags, onTagsChange }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await tagService.searchTags(searchQuery);
      setAllTags(data);
    } catch (error: any) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, [searchQuery]);

  const handleAddTag = async (tag: Tag) => {
    try {
      await tagService.addTagToMedia(mediaId, tag.id);
      onTagsChange([...selectedTags, tag]);
      enqueueSnackbar('Tag added successfully', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to add tag', { variant: 'error' });
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      await tagService.removeTagFromMedia(mediaId, tagId);
      onTagsChange(selectedTags.filter((t) => t.id !== tagId));
      enqueueSnackbar('Tag removed successfully', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to remove tag', { variant: 'error' });
    }
  };

  const availableTags = allTags.filter(
    (tag) => !selectedTags.find((st) => st.id === tag.id)
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {selectedTags.map((tag) => (
          <TagChip
            key={tag.id}
            tag={tag}
            onDelete={() => handleRemoveTag(tag.id)}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <Autocomplete
          fullWidth
          options={availableTags}
          getOptionLabel={(option) => option.name}
          loading={loading}
          inputValue={searchQuery}
          onInputChange={(_, newValue) => setSearchQuery(newValue)}
          onChange={(_, newValue) => {
            if (newValue) {
              handleAddTag(newValue);
              setSearchQuery('');
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Add tags"
              placeholder="Search or create tags..."
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: option.colorCode || '#757575',
                  }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Box>{option.name}</Box>
                  {option.description && (
                    <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {option.description}
                    </Box>
                  )}
                </Box>
                {option.usageCount !== undefined && (
                  <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {option.usageCount}
                  </Box>
                )}
              </Box>
            </li>
          )}
          noOptionsText={
            <Box sx={{ textAlign: 'center', py: 2 }}>
              No tags found.{' '}
              <Button
                size="small"
                onClick={() => setCreateDialogOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                Create new tag
              </Button>
            </Box>
          }
        />
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ minWidth: 'auto', px: 2 }}
        >
          New
        </Button>
      </Box>

      <CreateTagDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={loadTags}
      />
    </Box>
  );
};

export default TagPicker;
