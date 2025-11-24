import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  IconButton,
  Box,
  Typography,
  Slider,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Close,
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Speed,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';
import { MediaFile, MediaType } from '@/types';
import mediaService from '@/services/mediaService';

interface SlideshowProps {
  open: boolean;
  mediaFiles: MediaFile[];
  startIndex?: number;
  onClose: () => void;
}

const Slideshow: React.FC<SlideshowProps> = ({
  open,
  mediaFiles,
  startIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(3); // seconds
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Filter out videos, only show images
  const imageFiles = mediaFiles.filter((file) => file.mediaType === MediaType.IMAGE);

  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying && imageFiles.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % imageFiles.length);
      }, speed * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, speed, imageFiles.length]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [showControls]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % imageFiles.length);
    setShowControls(true);
  }, [imageFiles.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + imageFiles.length) % imageFiles.length);
    setShowControls(true);
  }, [imageFiles.length]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };

  const handleSpeedMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSpeedMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    handleSpeedMenuClose();
    setShowControls(true);
  };

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
    setShowControls(true);
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case ' ':
          setIsPlaying((prev) => !prev);
          setShowControls(true);
          event.preventDefault();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
          } else {
            onClose();
          }
          break;
      }
    },
    [handleNext, handlePrevious, isFullscreen, onClose]
  );

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, handleKeyDown]);

  if (imageFiles.length === 0) {
    return null;
  }

  const currentMedia = imageFiles[currentIndex];
  const mediaUrl = currentMedia ? mediaService.getOriginalUrl(currentMedia.filePath) : '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: 'black',
          overflow: 'hidden',
        },
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: showControls ? 'default' : 'none',
        }}
        onMouseMove={handleMouseMove}
      >
        {/* Image Display */}
        <img
          src={mediaUrl}
          alt={currentMedia?.fileName}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transition: 'opacity 0.5s ease-in-out',
          }}
        />

        {/* Controls Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s',
            pointerEvents: showControls ? 'auto' : 'none',
          }}
        >
          {/* Top Bar */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
            }}
          >
            <Typography variant="h6" sx={{ color: 'white' }}>
              {currentMedia?.fileName}
            </Typography>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>

          {/* Bottom Controls */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
              <IconButton onClick={handlePrevious} sx={{ color: 'white' }}>
                <SkipPrevious />
              </IconButton>

              <IconButton onClick={handleTogglePlay} sx={{ color: 'white' }}>
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>

              <IconButton onClick={handleNext} sx={{ color: 'white' }}>
                <SkipNext />
              </IconButton>

              <IconButton onClick={handleSpeedMenuOpen} sx={{ color: 'white' }}>
                <Speed />
              </IconButton>

              <IconButton onClick={handleToggleFullscreen} sx={{ color: 'white' }}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Box>

            <Box sx={{ px: 2 }}>
              <Slider
                value={currentIndex}
                onChange={(_, value) => setCurrentIndex(value as number)}
                min={0}
                max={imageFiles.length - 1}
                marks
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value + 1} / ${imageFiles.length}`}
                sx={{
                  color: 'white',
                  '& .MuiSlider-thumb': {
                    bgcolor: 'white',
                  },
                }}
              />
            </Box>

            <Typography
              variant="body2"
              sx={{ color: 'white', textAlign: 'center', mt: 1 }}
            >
              {currentIndex + 1} / {imageFiles.length}
            </Typography>
          </Box>
        </Box>

        {/* Speed Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleSpeedMenuClose}>
          <MenuItem onClick={() => handleSpeedChange(1)}>1 second</MenuItem>
          <MenuItem onClick={() => handleSpeedChange(2)}>2 seconds</MenuItem>
          <MenuItem onClick={() => handleSpeedChange(3)}>3 seconds</MenuItem>
          <MenuItem onClick={() => handleSpeedChange(5)}>5 seconds</MenuItem>
          <MenuItem onClick={() => handleSpeedChange(10)}>10 seconds</MenuItem>
        </Menu>
      </Box>
    </Dialog>
  );
};

export default Slideshow;
