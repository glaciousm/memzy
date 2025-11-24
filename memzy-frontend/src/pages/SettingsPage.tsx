import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Delete, Add, FolderOpen, PlayArrow } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import MainLayout from '@/components/layout/MainLayout';
import { useAppSelector } from '@/hooks/useRedux';
import { useThemeMode } from '@/theme/ThemeContext';
import watchedFolderService from '@/services/watchedFolderService';
import userService from '@/services/userService';
import { WatchedFolder } from '@/types';
import { useAppDispatch } from '@/hooks/useRedux';
import { setUser } from '@/store/authSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { mode, toggleTheme } = useThemeMode();
  const [tabValue, setTabValue] = useState(0);

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const [watchedFolders, setWatchedFolders] = useState<WatchedFolder[]>([]);
  const [newFolderPath, setNewFolderPath] = useState('');
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [scanningFolder, setScanningFolder] = useState<number | null>(null);

  const loadWatchedFolders = async () => {
    try {
      setLoadingFolders(true);
      const data = await watchedFolderService.getUserWatchedFolders();
      setWatchedFolders(data);
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load watched folders', { variant: 'error' });
    } finally {
      setLoadingFolders(false);
    }
  };

  useEffect(() => {
    if (tabValue === 1) {
      loadWatchedFolders();
    }
  }, [tabValue]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileSave = async () => {
    try {
      const result = await userService.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
      });

      // Update Redux store with new user data
      dispatch(setUser(result.user));

      enqueueSnackbar('Profile settings saved', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to update profile', { variant: 'error' });
    }
  };

  const handleAddFolder = async () => {
    if (newFolderPath.trim()) {
      try {
        await watchedFolderService.addWatchedFolder(newFolderPath);
        setNewFolderPath('');
        enqueueSnackbar('Folder added successfully', { variant: 'success' });
        loadWatchedFolders();
      } catch (error: any) {
        enqueueSnackbar(error.message || 'Failed to add folder', { variant: 'error' });
      }
    }
  };

  const handleRemoveFolder = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this watched folder?')) {
      try {
        await watchedFolderService.deleteWatchedFolder(id);
        enqueueSnackbar('Folder removed', { variant: 'success' });
        loadWatchedFolders();
      } catch (error: any) {
        enqueueSnackbar(error.message || 'Failed to remove folder', { variant: 'error' });
      }
    }
  };

  const handleScanNow = async (id: number) => {
    try {
      setScanningFolder(id);
      const result = await watchedFolderService.scanNow(id);
      enqueueSnackbar(`Scan complete. ${result.importedCount} files imported.`, { variant: 'success' });
      loadWatchedFolders();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to scan folder', { variant: 'error' });
    } finally {
      setScanningFolder(null);
    }
  };

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your application preferences
        </Typography>

        <Paper>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Profile" />
            <Tab label="Watched Folders" />
            <Tab label="Appearance" />
            <Tab label="Storage" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Box sx={{ maxWidth: 600 }}>
              <TextField
                label="First Name"
                fullWidth
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Last Name"
                fullWidth
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Email"
                fullWidth
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled
                sx={{ mb: 3 }}
              />
              <Button variant="contained" onClick={handleProfileSave}>
                Save Changes
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Watched Folders
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add folders to automatically import media files
            </Typography>

            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
              <TextField
                label="Folder Path"
                fullWidth
                value={newFolderPath}
                onChange={(e) => setNewFolderPath(e.target.value)}
                placeholder="/path/to/your/media"
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddFolder}
                sx={{ minWidth: 120 }}
              >
                Add
              </Button>
            </Box>

            {loadingFolders ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : watchedFolders.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                <FolderOpen sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No watched folders yet. Add a folder to start auto-importing media.
                </Typography>
              </Paper>
            ) : (
              <List>
                {watchedFolders.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={folder.folderPath}
                        secondary={`${folder.autoImport ? 'Auto-import enabled' : 'Auto-import disabled'} • ${folder.recursiveScan ? 'Recursive scan' : 'Single directory'} • Scan every ${folder.scanIntervalMinutes} minutes${folder.lastScan ? ` • Last scan: ${new Date(folder.lastScan).toLocaleString()}` : ''}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleScanNow(folder.id)}
                          disabled={scanningFolder === folder.id}
                          sx={{ mr: 1 }}
                        >
                          {scanningFolder === folder.id ? <CircularProgress size={24} /> : <PlayArrow />}
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleRemoveFolder(folder.id)}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Customize the look and feel of the application
            </Typography>

            <FormControlLabel
              control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />}
              label="Dark Mode"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 5, mt: 1 }}>
              Use dark theme for better viewing in low light
            </Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Storage & Performance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage storage and caching options
            </Typography>

            <Paper sx={{ p: 3, bgcolor: 'background.default', mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                Storage Usage
              </Typography>
              <Typography variant="h4" color="primary">
                0 GB
              </Typography>
              <Typography variant="caption" color="text.secondary">
                of unlimited storage used
              </Typography>
            </Paper>

            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Generate thumbnails"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 5, mb: 2 }}>
              Automatically create thumbnails for faster loading
            </Typography>

            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Extract metadata"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
              Extract EXIF data from images (camera, location, date)
            </Typography>
          </TabPanel>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default SettingsPage;
