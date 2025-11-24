import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import { CloudUpload, Close, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import mediaService from '@/services/mediaService';

interface MediaUploadProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

interface UploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const MediaUpload: React.FC<MediaUploadProps> = ({ open, onClose, onUploadComplete }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: UploadStatus[] = acceptedFiles.map((file) => ({
      file,
      status: 'pending',
      progress: 0,
    }));

    setUploads((prev) => [...prev, ...newUploads]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
    },
    disabled: isUploading,
  });

  const handleUpload = async () => {
    setIsUploading(true);

    for (let i = 0; i < uploads.length; i++) {
      if (uploads[i].status === 'success') continue;

      setUploads((prev) =>
        prev.map((upload, index) =>
          index === i ? { ...upload, status: 'uploading', progress: 50 } : upload
        )
      );

      try {
        await mediaService.uploadMedia(uploads[i].file);

        setUploads((prev) =>
          prev.map((upload, index) =>
            index === i ? { ...upload, status: 'success', progress: 100 } : upload
          )
        );

        enqueueSnackbar(`${uploads[i].file.name} uploaded successfully`, { variant: 'success' });
      } catch (error: any) {
        setUploads((prev) =>
          prev.map((upload, index) =>
            index === i
              ? {
                  ...upload,
                  status: 'error',
                  progress: 0,
                  error: error.message || 'Upload failed',
                }
              : upload
          )
        );

        enqueueSnackbar(`Failed to upload ${uploads[i].file.name}`, { variant: 'error' });
      }
    }

    setIsUploading(false);
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setUploads([]);
      onClose();
    }
  };

  const removeFile = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Upload Media Files</DialogTitle>
      <DialogContent>
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            mb: 2,
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or click to select files
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Supported: Images (JPG, PNG, GIF, WEBP) and Videos (MP4, AVI, MOV, MKV)
          </Typography>
        </Box>

        {uploads.length > 0 && (
          <List>
            {uploads.map((upload, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  !isUploading && upload.status !== 'uploading' ? (
                    <IconButton edge="end" onClick={() => removeFile(index)}>
                      <Close />
                    </IconButton>
                  ) : null
                }
              >
                <ListItemText
                  primary={upload.file.name}
                  secondary={
                    <>
                      <Typography variant="caption" component="span">
                        {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                      {upload.status === 'uploading' && (
                        <LinearProgress
                          variant="indeterminate"
                          sx={{ mt: 1 }}
                        />
                      )}
                      {upload.error && (
                        <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                          {upload.error}
                        </Typography>
                      )}
                    </>
                  }
                />
                {getStatusIcon(upload.status)}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={uploads.length === 0 || isUploading}
        >
          {isUploading ? 'Uploading...' : `Upload ${uploads.length} file(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MediaUpload;
