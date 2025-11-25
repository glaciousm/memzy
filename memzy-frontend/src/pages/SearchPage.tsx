import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Pagination,
  Collapse,
  Alert,
} from '@mui/material';
import {
  Search,
  FilterList,
  ExpandMore,
  ExpandLess,
  Save,
  Delete,
  PlayArrow,
  Clear,
  Photo,
  Videocam,
  Favorite,
  FavoriteBorder,
  CalendarMonth,
  LocalOffer,
  Bookmark,
  BookmarkBorder,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import MainLayout from '@/components/layout/MainLayout';
import MediaViewer from '@/components/media/MediaViewer';
import mediaService from '@/services/mediaService';
import tagService from '@/services/tagService';
import { MediaFile, Tag, MediaType, PageResponse } from '@/types';

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
}

interface SearchFilters {
  query: string;
  mediaType: MediaType | 'ALL';
  tagIds: number[];
  startDate: string;
  endDate: string;
  isFavorite: boolean | null;
  sortBy: string;
  sortDirection: string;
}

const defaultFilters: SearchFilters = {
  query: '',
  mediaType: 'ALL',
  tagIds: [],
  startDate: '',
  endDate: '',
  isFavorite: null,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

const SearchPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [results, setResults] = useState<MediaFile[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadTags();
    loadSavedSearches();
  }, []);

  const loadTags = async () => {
    try {
      const data = await tagService.getUserTags();
      setAllTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadSavedSearches = () => {
    const saved = localStorage.getItem('memzy_saved_searches');
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  };

  const saveSavedSearches = (searches: SavedSearch[]) => {
    localStorage.setItem('memzy_saved_searches', JSON.stringify(searches));
    setSavedSearches(searches);
  };

  const handleSearch = async (page: number = 0) => {
    setLoading(true);
    setHasSearched(true);
    setCurrentPage(page);

    try {
      const params: any = {
        page,
        size: 20,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
      };

      if (filters.mediaType !== 'ALL') {
        params.mediaType = filters.mediaType;
      }

      if (filters.tagIds.length > 0) {
        params.tagIds = filters.tagIds;
      }

      if (filters.startDate) {
        params.startDate = new Date(filters.startDate).toISOString();
      }

      if (filters.endDate) {
        params.endDate = new Date(filters.endDate).toISOString();
      }

      if (filters.isFavorite !== null) {
        params.isFavorite = filters.isFavorite;
      }

      const response = await mediaService.searchMedia(params);
      setResults(response.content);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Search failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setSelectedTags([]);
    setResults([]);
    setHasSearched(false);
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      enqueueSnackbar('Please enter a name for this search', { variant: 'error' });
      return;
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };

    saveSavedSearches([...savedSearches, newSearch]);
    setSearchName('');
    setSaveDialogOpen(false);
    enqueueSnackbar('Search saved successfully', { variant: 'success' });
  };

  const handleLoadSavedSearch = (search: SavedSearch) => {
    setFilters(search.filters);
    const tags = allTags.filter(t => search.filters.tagIds.includes(t.id));
    setSelectedTags(tags);
    setSavedSearchesOpen(false);
    handleSearch(0);
  };

  const handleDeleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id);
    saveSavedSearches(updated);
    enqueueSnackbar('Search deleted', { variant: 'success' });
  };

  const handleTagsChange = (_: any, newValue: Tag[]) => {
    setSelectedTags(newValue);
    setFilters({
      ...filters,
      tagIds: newValue.map(t => t.id),
    });
  };

  const handleMediaClick = (media: MediaFile, index: number) => {
    setSelectedMedia(media);
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  const getThumbnailUrl = (media: MediaFile) => {
    return `/api/files/thumbnails/${media.id}/small`;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.mediaType !== 'ALL') count++;
    if (filters.tagIds.length > 0) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.isFavorite !== null) count++;
    return count;
  };

  return (
    <MainLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight={600}>
            Search
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Bookmark />}
              onClick={() => setSavedSearchesOpen(true)}
              disabled={savedSearches.length === 0}
            >
              Saved ({savedSearches.length})
            </Button>
          </Box>
        </Box>

        {/* Search Bar */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              placeholder="Search your media library..."
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              size="large"
              onClick={() => handleSearch()}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Box>

          {/* Advanced Filters Toggle */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              startIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setShowAdvanced(!showAdvanced)}
              endIcon={
                getActiveFiltersCount() > 0 && (
                  <Chip size="small" label={getActiveFiltersCount()} color="primary" />
                )
              }
            >
              <FilterList sx={{ mr: 0.5 }} />
              Advanced Filters
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {hasSearched && (
                <Button
                  variant="outlined"
                  startIcon={<Save />}
                  onClick={() => setSaveDialogOpen(true)}
                  size="small"
                >
                  Save Search
                </Button>
              )}
              {getActiveFiltersCount() > 0 && (
                <Button
                  variant="text"
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                  size="small"
                  color="error"
                >
                  Clear All
                </Button>
              )}
            </Box>
          </Box>

          {/* Advanced Filters Panel */}
          <Collapse in={showAdvanced}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              {/* Media Type */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Media Type</InputLabel>
                  <Select
                    value={filters.mediaType}
                    label="Media Type"
                    onChange={(e) => setFilters({ ...filters, mediaType: e.target.value as any })}
                  >
                    <MenuItem value="ALL">All Media</MenuItem>
                    <MenuItem value={MediaType.IMAGE}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Photo fontSize="small" /> Images
                      </Box>
                    </MenuItem>
                    <MenuItem value={MediaType.VIDEO}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Videocam fontSize="small" /> Videos
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Favorites Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Favorites</InputLabel>
                  <Select
                    value={filters.isFavorite === null ? 'all' : String(filters.isFavorite)}
                    label="Favorites"
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilters({
                        ...filters,
                        isFavorite: val === 'all' ? null : val === 'true',
                      });
                    }}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="true">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Favorite fontSize="small" color="error" /> Favorites Only
                      </Box>
                    </MenuItem>
                    <MenuItem value="false">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FavoriteBorder fontSize="small" /> Non-Favorites
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Date Range */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonth fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonth fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Tags */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={allTags}
                  getOptionLabel={(option) => option.name}
                  value={selectedTags}
                  onChange={handleTagsChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Tags"
                      placeholder="Select tags..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <LocalOffer fontSize="small" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
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
                />
              </Grid>

              {/* Sort Options */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.sortBy}
                    label="Sort By"
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  >
                    <MenuItem value="createdAt">Date Added</MenuItem>
                    <MenuItem value="dateTaken">Date Taken</MenuItem>
                    <MenuItem value="fileName">File Name</MenuItem>
                    <MenuItem value="fileSize">File Size</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Order</InputLabel>
                  <Select
                    value={filters.sortDirection}
                    label="Order"
                    onChange={(e) => setFilters({ ...filters, sortDirection: e.target.value })}
                  >
                    <MenuItem value="DESC">Newest First</MenuItem>
                    <MenuItem value="ASC">Oldest First</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        {/* Results */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : hasSearched ? (
          results.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Search sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No results found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or search criteria
              </Typography>
            </Paper>
          ) : (
            <>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Found {results.length} results
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {results.map((media, index) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={media.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => handleMediaClick(media, index)}
                    >
                      <CardMedia
                        component="img"
                        height={140}
                        image={getThumbnailUrl(media)}
                        alt={media.fileName}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ p: 1.5, pb: '8px !important' }}>
                        <Typography variant="body2" noWrap title={media.fileName}>
                          {media.fileName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          {media.mediaType === MediaType.IMAGE ? (
                            <Photo fontSize="small" color="action" />
                          ) : (
                            <Videocam fontSize="small" color="action" />
                          )}
                          {media.isFavorite && (
                            <Favorite fontSize="small" color="error" />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage + 1}
                    onChange={(_, page) => handleSearch(page - 1)}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Search sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Search your media library
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Use filters to find specific images and videos in your collection
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip
                icon={<Photo />}
                label="Images"
                onClick={() => {
                  setFilters({ ...filters, mediaType: MediaType.IMAGE });
                  handleSearch();
                }}
              />
              <Chip
                icon={<Videocam />}
                label="Videos"
                onClick={() => {
                  setFilters({ ...filters, mediaType: MediaType.VIDEO });
                  handleSearch();
                }}
              />
              <Chip
                icon={<Favorite />}
                label="Favorites"
                onClick={() => {
                  setFilters({ ...filters, isFavorite: true });
                  handleSearch();
                }}
              />
            </Box>
          </Paper>
        )}

        {/* Save Search Dialog */}
        <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
          <DialogTitle>Save Search</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Search Name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="e.g., Summer 2024 Photos"
              sx={{ mt: 2 }}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              This will save your current filter settings for quick access later.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSearch} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Saved Searches Dialog */}
        <Dialog
          open={savedSearchesOpen}
          onClose={() => setSavedSearchesOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Saved Searches</DialogTitle>
          <DialogContent>
            {savedSearches.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No saved searches yet
              </Typography>
            ) : (
              <List>
                {savedSearches.map((search) => (
                  <ListItem key={search.id} divider>
                    <ListItemText
                      primary={search.name}
                      secondary={`Created ${format(new Date(search.createdAt), 'MMM d, yyyy')}`}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Run search">
                        <IconButton onClick={() => handleLoadSavedSearch(search)}>
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDeleteSavedSearch(search.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSavedSearchesOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Media Viewer */}
        {selectedMedia && (
          <MediaViewer
            open={viewerOpen}
            media={selectedMedia}
            mediaList={results}
            currentIndex={selectedIndex}
            onClose={() => setViewerOpen(false)}
            onNavigate={(newIndex) => {
              setSelectedIndex(newIndex);
              setSelectedMedia(results[newIndex]);
            }}
          />
        )}
      </Box>
    </MainLayout>
  );
};

export default SearchPage;
