import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import { ContentCopy, Check } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import shareLinkService, { CreateShareLinkRequest, ShareLink } from '@/services/shareLinkService';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  mediaFileId?: number;
  albumId?: number;
  title: string;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  mediaFileId,
  albumId,
  title,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [expirationHours, setExpirationHours] = useState<number>(24);
  const [allowDownload, setAllowDownload] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [maxViews, setMaxViews] = useState<number | undefined>(undefined);

  const handleCreateShareLink = async () => {
    setLoading(true);

    try {
      const request: CreateShareLinkRequest = {
        expirationHours: expirationHours > 0 ? expirationHours : undefined,
        allowDownload,
        password: requirePassword ? password : undefined,
        maxViews,
      };

      let response;
      if (mediaFileId) {
        response = await shareLinkService.createMediaShareLink(mediaFileId, request);
      } else if (albumId) {
        response = await shareLinkService.createAlbumShareLink(albumId, request);
      } else {
        throw new Error('Either mediaFileId or albumId must be provided');
      }

      setShareLink(response.shareLink);
      enqueueSnackbar('Share link created successfully', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to create share link', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink.shareUrl);
      setCopied(true);
      enqueueSnackbar('Link copied to clipboard', { variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setShareLink(null);
    setCopied(false);
    setExpirationHours(24);
    setAllowDownload(false);
    setRequirePassword(false);
    setPassword('');
    setMaxViews(undefined);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share {title}</DialogTitle>
      <DialogContent>
        {!shareLink ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure share link settings
            </Typography>

            <TextField
              label="Expiration (hours)"
              type="number"
              value={expirationHours}
              onChange={(e) => setExpirationHours(Number(e.target.value))}
              fullWidth
              sx={{ mb: 2 }}
              helperText="Set to 0 for no expiration"
            />

            <TextField
              label="Max Views"
              type="number"
              value={maxViews || ''}
              onChange={(e) => setMaxViews(e.target.value ? Number(e.target.value) : undefined)}
              fullWidth
              sx={{ mb: 2 }}
              helperText="Leave empty for unlimited views"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                />
              }
              label="Allow downloads"
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={requirePassword}
                  onChange={(e) => setRequirePassword(e.target.checked)}
                />
              }
              label="Require password"
              sx={{ mb: 2 }}
            />

            {requirePassword && (
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Share link created successfully! Copy the link below to share.
            </Typography>

            <TextField
              label="Share URL"
              value={shareLink.shareUrl}
              fullWidth
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleCopyLink} edge="end">
                      {copied ? <Check color="success" /> : <ContentCopy />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Views:
                </Typography>
                <Typography variant="body2">
                  {shareLink.viewCount} {shareLink.maxViews ? `/ ${shareLink.maxViews}` : ''}
                </Typography>
              </Box>

              {shareLink.expiresAt && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Expires:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(shareLink.expiresAt).toLocaleString()}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Download:
                </Typography>
                <Typography variant="body2">
                  {shareLink.allowDownload ? 'Allowed' : 'Not allowed'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Password:
                </Typography>
                <Typography variant="body2">
                  {shareLink.requirePassword ? 'Required' : 'Not required'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        {!shareLink && (
          <Button
            onClick={handleCreateShareLink}
            variant="contained"
            disabled={loading || (requirePassword && !password)}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Creating...' : 'Create Share Link'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
