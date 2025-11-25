import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardActionArea,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import peopleService, { Person, Face } from '@/services/peopleService';
import { useNavigate, useParams } from 'react-router-dom';

const PersonDetailView: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<Person | null>(null);
  const [faces, setFaces] = useState<Face[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (id) {
      loadPersonDetails();
    }
  }, [id]);

  const loadPersonDetails = async () => {
    try {
      setLoading(true);
      const personData = await peopleService.getPersonById(Number(id));
      const facesData = await peopleService.getPersonFaces(Number(id));

      setPerson(personData);
      setFaces(facesData);
      setEditName(personData.name);
      setEditDescription(personData.description || '');
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load person details', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePerson = async () => {
    if (!editName.trim() || !person) {
      enqueueSnackbar('Name is required', { variant: 'error' });
      return;
    }

    try {
      await peopleService.updatePerson(person.id, editName, editDescription);
      enqueueSnackbar('Person updated successfully', { variant: 'success' });
      setEditDialogOpen(false);
      await loadPersonDetails();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to update person', { variant: 'error' });
    }
  };

  const handleDeletePerson = async () => {
    if (!person) return;

    if (!window.confirm(`Are you sure you want to delete "${person.name}"?`)) {
      return;
    }

    try {
      await peopleService.deletePerson(person.id);
      enqueueSnackbar('Person deleted successfully', { variant: 'success' });
      navigate('/people');
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to delete person', { variant: 'error' });
    }
  };

  const handleUnassignFace = async (faceId: number) => {
    try {
      await peopleService.unassignFace(faceId);
      enqueueSnackbar('Face unassigned successfully', { variant: 'success' });
      await loadPersonDetails();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to unassign face', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!person) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6">Person not found</Typography>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/people')}>
          Back to People
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/people')}
          sx={{ textDecoration: 'none', cursor: 'pointer' }}
        >
          People
        </Link>
        <Typography color="text.primary">{person.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">{person.name}</Typography>
          {person.description && (
            <Typography variant="body1" color="text.secondary">
              {person.description}
            </Typography>
          )}
          <Chip label={`${person.faceCount} photos`} sx={{ mt: 1 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => setEditDialogOpen(true)}>
            <Edit />
          </IconButton>
          <IconButton onClick={handleDeletePerson} color="error">
            <Delete />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {faces.map((face) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={face.id}>
            <Card>
              <CardActionArea onClick={() => navigate(`/media/${face.mediaId}`)}>
                <CardMedia
                  component="img"
                  height="150"
                  image={`/api/media/${face.mediaId}/thumbnail/300`}
                  alt={`Face ${face.id}`}
                />
              </CardActionArea>
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button
                  size="small"
                  onClick={() => handleUnassignFace(face.id)}
                >
                  Unassign
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {faces.length === 0 && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No faces assigned to this person yet
          </Typography>
        </Box>
      )}

      {/* Edit Person Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Person</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdatePerson} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PersonDetailView;
