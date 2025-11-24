import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  TextField,
  Grid,
  Divider,
} from '@mui/material';
import {
  Crop,
  Rotate90DegreesCcw,
  Brightness4,
  Contrast,
  FilterVintage,
  Flip,
  AspectRatio,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { MediaFile } from '@/types';
import imageEditingService, { ImageEditRequest } from '@/services/imageEditingService';

interface ImageEditorProps {
  open: boolean;
  media: MediaFile | null;
  onClose: () => void;
  onEditComplete: (editedMedia: MediaFile) => void;
}

type EditMode = 'crop' | 'rotate' | 'flip' | 'adjustments' | 'filters' | 'resize' | null;

const ImageEditor: React.FC<ImageEditorProps> = ({ open, media, onClose, onEditComplete }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [loading, setLoading] = useState(false);

  // Crop state
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropWidth, setCropWidth] = useState(100);
  const [cropHeight, setCropHeight] = useState(100);

  // Rotate state
  const [rotateDegrees, setRotateDegrees] = useState(0);

  // Flip state
  const [flipHorizontal, setFlipHorizontal] = useState(true);

  // Adjustments state
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);

  // Filter state
  const [filterType, setFilterType] = useState<'grayscale' | 'sepia'>('grayscale');

  // Resize state
  const [resizeWidth, setResizeWidth] = useState(800);
  const [resizeHeight, setResizeHeight] = useState(600);

  if (!media) return null;

  const handleApplyEdit = async () => {
    if (!editMode) {
      enqueueSnackbar('Please select an edit type', { variant: 'warning' });
      return;
    }

    setLoading(true);

    try {
      let request: ImageEditRequest = {
        mediaFileId: media.id,
        editType: editMode,
      };

      switch (editMode) {
        case 'crop':
          request = { ...request, cropX, cropY, cropWidth, cropHeight };
          break;
        case 'rotate':
          request = { ...request, rotateDegrees };
          break;
        case 'flip':
          request = { ...request, flipHorizontal };
          break;
        case 'adjustments':
          request = { ...request, brightness, contrast, editType: brightness !== 0 ? 'brightness' : 'contrast' };
          break;
        case 'filters':
          request = { ...request, filterType, editType: 'filter' };
          break;
        case 'resize':
          request = { ...request, resizeWidth, resizeHeight };
          break;
      }

      const response = await imageEditingService.editImage(request);
      enqueueSnackbar('Image edited successfully', { variant: 'success' });
      onEditComplete(response.mediaFile);
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to edit image', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Image</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Select Edit Type
          </Typography>
          <ToggleButtonGroup
            value={editMode}
            exclusive
            onChange={(_, value) => setEditMode(value)}
            fullWidth
          >
            <ToggleButton value="crop">
              <Crop sx={{ mr: 1 }} />
              Crop
            </ToggleButton>
            <ToggleButton value="rotate">
              <Rotate90DegreesCcw sx={{ mr: 1 }} />
              Rotate
            </ToggleButton>
            <ToggleButton value="flip">
              <Flip sx={{ mr: 1 }} />
              Flip
            </ToggleButton>
            <ToggleButton value="adjustments">
              <Brightness4 sx={{ mr: 1 }} />
              Adjust
            </ToggleButton>
            <ToggleButton value="filters">
              <FilterVintage sx={{ mr: 1 }} />
              Filters
            </ToggleButton>
            <ToggleButton value="resize">
              <AspectRatio sx={{ mr: 1 }} />
              Resize
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider sx={{ my: 2 }} />

        {editMode === 'crop' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Crop Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="X Position"
                  type="number"
                  value={cropX}
                  onChange={(e) => setCropX(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Y Position"
                  type="number"
                  value={cropY}
                  onChange={(e) => setCropY(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Width"
                  type="number"
                  value={cropWidth}
                  onChange={(e) => setCropWidth(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Height"
                  type="number"
                  value={cropHeight}
                  onChange={(e) => setCropHeight(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {editMode === 'rotate' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Rotation: {rotateDegrees}°
            </Typography>
            <Slider
              value={rotateDegrees}
              onChange={(_, value) => setRotateDegrees(value as number)}
              min={-180}
              max={180}
              step={15}
              marks
              valueLabelDisplay="auto"
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button onClick={() => setRotateDegrees(90)} variant="outlined" size="small">
                90°
              </Button>
              <Button onClick={() => setRotateDegrees(180)} variant="outlined" size="small">
                180°
              </Button>
              <Button onClick={() => setRotateDegrees(-90)} variant="outlined" size="small">
                -90°
              </Button>
            </Box>
          </Box>
        )}

        {editMode === 'flip' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Flip Direction
            </Typography>
            <ToggleButtonGroup
              value={flipHorizontal}
              exclusive
              onChange={(_, value) => setFlipHorizontal(value)}
              fullWidth
            >
              <ToggleButton value={true}>Horizontal</ToggleButton>
              <ToggleButton value={false}>Vertical</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {editMode === 'adjustments' && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Brightness: {brightness.toFixed(2)}
              </Typography>
              <Slider
                value={brightness}
                onChange={(_, value) => setBrightness(value as number)}
                min={-1}
                max={1}
                step={0.1}
                valueLabelDisplay="auto"
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Contrast: {contrast.toFixed(2)}
              </Typography>
              <Slider
                value={contrast}
                onChange={(_, value) => setContrast(value as number)}
                min={-1}
                max={1}
                step={0.1}
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>
        )}

        {editMode === 'filters' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Select Filter
            </Typography>
            <ToggleButtonGroup
              value={filterType}
              exclusive
              onChange={(_, value) => setFilterType(value)}
              fullWidth
            >
              <ToggleButton value="grayscale">Grayscale</ToggleButton>
              <ToggleButton value="sepia">Sepia</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {editMode === 'resize' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Resize Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Width"
                  type="number"
                  value={resizeWidth}
                  onChange={(e) => setResizeWidth(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Height"
                  type="number"
                  value={resizeHeight}
                  onChange={(e) => setResizeHeight(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {!editMode && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Select an edit type above to get started
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleApplyEdit}
          variant="contained"
          disabled={!editMode || loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Applying...' : 'Apply Edit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageEditor;
