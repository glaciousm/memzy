import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  CloudDone,
  CloudOff,
  Delete,
  Sync,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import cloudStorageService, { CloudStorage } from '@/services/cloudStorageService';
import { format } from 'date-fns';

const CloudStorageSettings: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [cloudStorages, setCloudStorages] = useState<CloudStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadCloudStorages();
  }, []);

  const loadCloudStorages = async () => {
    try {
      setLoading(true);
      const data = await cloudStorageService.getUserCloudStorages();
      setCloudStorages(data);
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load cloud storages', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogleDrive = async () => {
    setConnecting(true);
    try {
      const { authUrl } = await cloudStorageService.getGoogleDriveAuthUrl();
      // Open OAuth window
      window.location.href = authUrl;
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to connect to Google Drive', { variant: 'error' });
      setConnecting(false);
    }
  };

  const handleConnectDropbox = async () => {
    setConnecting(true);
    try {
      const { authUrl } = await cloudStorageService.getDropboxAuthUrl();
      // Open OAuth window
      window.location.href = authUrl;
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to connect to Dropbox', { variant: 'error' });
      setConnecting(false);
    }
  };

  const handleConnectOneDrive = async () => {
    setConnecting(true);
    try {
      const { authUrl } = await cloudStorageService.getOneDriveAuthUrl();
      // Open OAuth window
      window.location.href = authUrl;
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to connect to OneDrive', { variant: 'error' });
      setConnecting(false);
    }
  };

  const handleDisconnect = async (id: number) => {
    if (!window.confirm('Are you sure you want to disconnect this cloud storage?')) {
      return;
    }

    try {
      await cloudStorageService.disconnectCloudStorage(id);
      enqueueSnackbar('Cloud storage disconnected', { variant: 'success' });
      await loadCloudStorages();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to disconnect', { variant: 'error' });
    }
  };

  const handleToggleAutoSync = async (id: number, currentValue: boolean) => {
    try {
      await cloudStorageService.toggleAutoSync(id, !currentValue);
      enqueueSnackbar('Auto-sync updated', { variant: 'success' });
      await loadCloudStorages();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to update auto-sync', { variant: 'error' });
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'GOOGLE_DRIVE':
        return <CloudDone color="primary" />;
      case 'DROPBOX':
        return <CloudUpload color="info" />;
      case 'ONEDRIVE':
        return <CloudUpload color="secondary" />;
      default:
        return <CloudOff />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'GOOGLE_DRIVE':
        return 'Google Drive';
      case 'DROPBOX':
        return 'Dropbox';
      case 'ONEDRIVE':
        return 'OneDrive';
      default:
        return provider;
    }
  };

  const googleDriveConnected = cloudStorages.some((cs) => cs.provider === 'GOOGLE_DRIVE' && cs.isActive);
  const dropboxConnected = cloudStorages.some((cs) => cs.provider === 'DROPBOX' && cs.isActive);
  const onedriveConnected = cloudStorages.some((cs) => cs.provider === 'ONEDRIVE' && cs.isActive);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Cloud Storage
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Connect your cloud storage accounts to automatically sync and backup your media files.
      </Alert>

      {/* Connected Accounts */}
      {cloudStorages.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Connected Accounts
            </Typography>
            <List>
              {cloudStorages.map((storage, index) => (
                <React.Fragment key={storage.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <Box sx={{ mr: 2 }}>{getProviderIcon(storage.provider)}</Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {getProviderName(storage.provider)}
                          </Typography>
                          {storage.isActive && <Chip label="Active" size="small" color="success" />}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {storage.accountEmail}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Uploaded: {storage.totalFilesUploaded} files • Downloaded: {storage.totalFilesDownloaded} files
                          </Typography>
                          {storage.lastSyncAt && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Last sync: {format(new Date(storage.lastSyncAt), 'MMM d, yyyy h:mm a')}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ mr: 1 }}>
                            Auto-sync
                          </Typography>
                          <Switch
                            checked={storage.autoSync}
                            onChange={() => handleToggleAutoSync(storage.id, storage.autoSync)}
                          />
                        </Box>
                        <IconButton onClick={() => handleDisconnect(storage.id)} color="error">
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Connect New Accounts */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Connect New Account
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CloudDone color="primary" fontSize="large" />
                <Box>
                  <Typography variant="subtitle1">Google Drive</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sync files with your Google Drive account
                  </Typography>
                </Box>
              </Box>
              <Button
                variant={googleDriveConnected ? 'outlined' : 'contained'}
                onClick={handleConnectGoogleDrive}
                disabled={connecting || googleDriveConnected}
                startIcon={connecting ? <CircularProgress size={20} /> : <CloudUpload />}
              >
                {googleDriveConnected ? 'Connected' : 'Connect'}
              </Button>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CloudUpload color="info" fontSize="large" />
                <Box>
                  <Typography variant="subtitle1">Dropbox</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sync files with your Dropbox account
                  </Typography>
                </Box>
              </Box>
              <Button
                variant={dropboxConnected ? 'outlined' : 'contained'}
                onClick={handleConnectDropbox}
                disabled={connecting || dropboxConnected}
                startIcon={connecting ? <CircularProgress size={20} /> : <CloudUpload />}
              >
                {dropboxConnected ? 'Connected' : 'Connect'}
              </Button>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CloudUpload color="secondary" fontSize="large" />
                <Box>
                  <Typography variant="subtitle1">OneDrive</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sync files with your OneDrive account
                  </Typography>
                </Box>
              </Box>
              <Button
                variant={onedriveConnected ? 'outlined' : 'contained'}
                onClick={handleConnectOneDrive}
                disabled={connecting || onedriveConnected}
                startIcon={connecting ? <CircularProgress size={20} /> : <CloudUpload />}
              >
                {onedriveConnected ? 'Connected' : 'Connect'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CloudStorageSettings;
