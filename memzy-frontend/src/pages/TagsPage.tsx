import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  CircularProgress,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Search,
  MoreVert,
  Edit,
  Delete,
  LocalOffer,
  SortByAlpha,
  Numbers,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import MainLayout from '@/components/layout/MainLayout';
import CreateTagDialog from '@/components/tags/CreateTagDialog';
import EditTagDialog from '@/components/tags/EditTagDialog';
import tagService from '@/services/tagService';
import { Tag } from '@/types';

type SortOption = 'name' | 'usage' | 'created';

const TagsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [tags, setTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await tagService.getUserTags();
      setTags(data);
      setFilteredTags(data);
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load tags', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    let result = [...tags];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        tag =>
          tag.name.toLowerCase().includes(query) ||
          (tag.description && tag.description.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return (b.usageCount || 0) - (a.usageCount || 0);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredTags(result);
  }, [tags, searchQuery, sortBy]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tag: Tag) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTag(tag);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTag(null);
  };

  const handleEditTag = () => {
    setEditDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteTag = async () => {
    if (!selectedTag) return;

    if (window.confirm(`Are you sure you want to delete "${selectedTag.name}"? This will remove the tag from all media.`)) {
      try {
        await tagService.deleteTag(selectedTag.id);
        enqueueSnackbar('Tag deleted successfully', { variant: 'success' });
        loadTags();
      } catch (error: any) {
        enqueueSnackbar('Failed to delete tag', { variant: 'error' });
      }
    }
    handleMenuClose();
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'name':
        return 'Name';
      case 'usage':
        return 'Usage';
      case 'created':
        return 'Created';
      default:
        return 'Sort';
    }
  };

  return (
    <MainLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight={600}>
            Tags
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Tag
          </Button>
        </Box>

        {/* Search and Sort Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search tags..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1, maxWidth: 400 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={(e) => setSortMenuAnchor(e.currentTarget)}
              startIcon={sortBy === 'name' ? <SortByAlpha /> : <Numbers />}
            >
              Sort: {getSortLabel()}
            </Button>
            <Menu
              anchorEl={sortMenuAnchor}
              open={Boolean(sortMenuAnchor)}
              onClose={() => setSortMenuAnchor(null)}
            >
              <MenuItem
                onClick={() => { setSortBy('name'); setSortMenuAnchor(null); }}
                selected={sortBy === 'name'}
              >
                <SortByAlpha sx={{ mr: 1 }} /> Name
              </MenuItem>
              <MenuItem
                onClick={() => { setSortBy('usage'); setSortMenuAnchor(null); }}
                selected={sortBy === 'usage'}
              >
                <Numbers sx={{ mr: 1 }} /> Usage Count
              </MenuItem>
              <MenuItem
                onClick={() => { setSortBy('created'); setSortMenuAnchor(null); }}
                selected={sortBy === 'created'}
              >
                <LocalOffer sx={{ mr: 1 }} /> Recently Created
              </MenuItem>
            </Menu>
          </Box>
        </Paper>

        {/* Tags Stats */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Chip
            label={`${tags.length} tags total`}
            variant="outlined"
            icon={<LocalOffer />}
          />
          {searchQuery && (
            <Chip
              label={`${filteredTags.length} matching`}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredTags.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <LocalOffer sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {searchQuery ? 'No tags found' : 'No tags yet'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Create tags to organize and categorize your media'}
            </Typography>
            {!searchQuery && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Your First Tag
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filteredTags.map((tag) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={tag.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 8,
                      bgcolor: tag.colorCode || '#2196f3',
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: tag.colorCode || '#2196f3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <LocalOffer sx={{ fontSize: 14, color: 'white' }} />
                      </Box>
                      <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                        {tag.name}
                      </Typography>
                    </Box>
                    {tag.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          mb: 1,
                        }}
                      >
                        {tag.description}
                      </Typography>
                    )}
                    <Tooltip title="Number of media items with this tag">
                      <Chip
                        size="small"
                        label={`${tag.usageCount || 0} items`}
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    </Tooltip>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, tag)}>
                      <MoreVert />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <CreateTagDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onCreated={loadTags}
        />

        <EditTagDialog
          open={editDialogOpen}
          tag={selectedTag}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedTag(null);
          }}
          onUpdated={loadTags}
        />

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleEditTag}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleDeleteTag} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </MainLayout>
  );
};

export default TagsPage;
