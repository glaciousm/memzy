import React, { useState } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Close,
  Delete,
  Favorite,
  FavoriteBorder,
  Folder,
  Label,
  Download,
  Share,
} from '@mui/icons-material';
import { MediaFile } from '@/types';

interface BatchActionsBarProps {
  selectedItems: MediaFile[];
  onClose: () => void;
  onDelete: (ids: number[]) => void;
  onAddToFavorites: (ids: number[]) => void;
  onRemoveFromFavorites: (ids: number[]) => void;
  onAddToAlbum: (ids: number[]) => void;
  onAddTags: (ids: number[]) => void;
  onDownload: (ids: number[]) => void;
  onShare: (ids: number[]) => void;
}

const BatchActionsBar: React.FC<BatchActionsBarProps> = ({
  selectedItems,
  onClose,
  onDelete,
  onAddToFavorites,
  onRemoveFromFavorites,
  onAddToAlbum,
  onAddTags,
  onDownload,
  onShare,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuType, setMenuType] = useState<string | null>(null);

  const selectedIds = selectedItems.map((item) => item.id);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, type: string) => {
    setAnchorEl(event.currentTarget);
    setMenuType(type);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuType(null);
  };

  const handleFavoriteAction = (add: boolean) => {
    if (add) {
      onAddToFavorites(selectedIds);
    } else {
      onRemoveFromFavorites(selectedIds);
    }
    handleMenuClose();
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'primary.main',
        color: 'white',
        zIndex: 1100,
        boxShadow: 3,
      }}
    >
      <Toolbar>
        <IconButton color="inherit" onClick={onClose} sx={{ mr: 2 }}>
          <Close />
        </IconButton>

        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
        </Typography>

        <Tooltip title="Favorite">
          <IconButton
            color="inherit"
            onClick={(e) => handleMenuOpen(e, 'favorite')}
          >
            <Favorite />
          </IconButton>
        </Tooltip>

        <Tooltip title="Add to Album">
          <IconButton color="inherit" onClick={() => onAddToAlbum(selectedIds)}>
            <Folder />
          </IconButton>
        </Tooltip>

        <Tooltip title="Add Tags">
          <IconButton color="inherit" onClick={() => onAddTags(selectedIds)}>
            <Label />
          </IconButton>
        </Tooltip>

        <Tooltip title="Download">
          <IconButton color="inherit" onClick={() => onDownload(selectedIds)}>
            <Download />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share">
          <IconButton color="inherit" onClick={() => onShare(selectedIds)}>
            <Share />
          </IconButton>
        </Tooltip>

        <Tooltip title="Delete">
          <IconButton color="inherit" onClick={() => onDelete(selectedIds)}>
            <Delete />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && menuType === 'favorite'}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleFavoriteAction(true)}>
            <Favorite sx={{ mr: 1 }} /> Add to Favorites
          </MenuItem>
          <MenuItem onClick={() => handleFavoriteAction(false)}>
            <FavoriteBorder sx={{ mr: 1 }} /> Remove from Favorites
          </MenuItem>
        </Menu>
      </Toolbar>
    </Box>
  );
};

export default BatchActionsBar;
