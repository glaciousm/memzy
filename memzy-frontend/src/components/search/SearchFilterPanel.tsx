import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  Typography,
  Button,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  TextField,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import { Close, FilterList } from '@mui/icons-material';
import tagService from '@/services/tagService';
import { Tag, MediaType } from '@/types';
import { format } from 'date-fns';

export interface SearchFilters {
  mediaType: MediaType | 'ALL';
  tagIds: number[];
  startDate: Date | null;
  endDate: Date | null;
  favorites: boolean | null;
}

interface SearchFilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  open,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onReset,
}) => {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    if (filters.tagIds.length > 0 && allTags.length > 0) {
      const tags = allTags.filter((tag) => filters.tagIds.includes(tag.id));
      setSelectedTags(tags);
    } else {
      setSelectedTags([]);
    }
  }, [filters.tagIds, allTags]);

  const loadTags = async () => {
    try {
      const data = await tagService.searchTags('');
      setAllTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleMediaTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      mediaType: event.target.value as MediaType | 'ALL',
    });
  };

  const handleTagsChange = (_: any, newValue: Tag[]) => {
    setSelectedTags(newValue);
    onFiltersChange({
      ...filters,
      tagIds: newValue.map((tag) => tag.id),
    });
  };

  const handleFavoritesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      favorites: value === 'all' ? null : value === 'true',
    });
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value ? new Date(event.target.value) : null;
    onFiltersChange({
      ...filters,
      startDate: date,
    });
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value ? new Date(event.target.value) : null;
    onFiltersChange({
      ...filters,
      endDate: date,
    });
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    try {
      return format(date, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  const hasActiveFilters =
    filters.mediaType !== 'ALL' ||
    filters.tagIds.length > 0 ||
    filters.startDate !== null ||
    filters.endDate !== null ||
    filters.favorites !== null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 350, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            <Typography variant="h6">Filters</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Media Type Filter */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend">Media Type</FormLabel>
          <RadioGroup value={filters.mediaType} onChange={handleMediaTypeChange}>
            <FormControlLabel value="ALL" control={<Radio />} label="All Media" />
            <FormControlLabel value={MediaType.IMAGE} control={<Radio />} label="Images Only" />
            <FormControlLabel value={MediaType.VIDEO} control={<Radio />} label="Videos Only" />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ mb: 3 }} />

        {/* Tags Filter */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 1 }}>
            Tags
          </FormLabel>
          <Autocomplete
            multiple
            options={allTags}
            getOptionLabel={(option) => option.name}
            value={selectedTags}
            onChange={handleTagsChange}
            renderInput={(params) => <TextField {...params} placeholder="Select tags..." />}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.name}
                  size="small"
                  sx={{
                    bgcolor: option.colorCode || 'primary.main',
                    color: 'white',
                  }}
                />
              ))
            }
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
                  <Box sx={{ flexGrow: 1 }}>{option.name}</Box>
                </Box>
              </li>
            )}
          />
        </FormControl>

        <Divider sx={{ mb: 3 }} />

        {/* Date Range Filter */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 1 }}>
            Date Range
          </FormLabel>
          <Stack spacing={2}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              size="small"
              value={formatDateForInput(filters.startDate)}
              onChange={handleStartDateChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              size="small"
              value={formatDateForInput(filters.endDate)}
              onChange={handleEndDateChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Stack>
        </FormControl>

        <Divider sx={{ mb: 3 }} />

        {/* Favorites Filter */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend">Favorites</FormLabel>
          <RadioGroup
            value={filters.favorites === null ? 'all' : String(filters.favorites)}
            onChange={handleFavoritesChange}
          >
            <FormControlLabel value="all" control={<Radio />} label="All Media" />
            <FormControlLabel value="true" control={<Radio />} label="Favorites Only" />
            <FormControlLabel value="false" control={<Radio />} label="Non-Favorites" />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ mb: 3 }} />

        {/* Action Buttons */}
        <Stack spacing={2}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              onApply();
              onClose();
            }}
          >
            Apply Filters
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={onReset}
            disabled={!hasActiveFilters}
          >
            Reset All
          </Button>
        </Stack>

        {hasActiveFilters && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Active filters applied
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default SearchFilterPanel;
