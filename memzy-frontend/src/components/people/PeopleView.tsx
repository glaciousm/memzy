import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
  Menu,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add,
  MoreVert,
  PersonAdd,
  AutoAwesome,
  GroupWork,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import peopleService, { Person } from '@/services/peopleService';
import { useNavigate } from 'react-router-dom';

const PeopleView: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonDescription, setNewPersonDescription] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      setLoading(true);
      const data = await peopleService.getAllPeople();
      setPeople(data);
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load people', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePerson = async () => {
    if (!newPersonName.trim()) {
      enqueueSnackbar('Name is required', { variant: 'error' });
      return;
    }

    try {
      await peopleService.createPerson(newPersonName, newPersonDescription);
      enqueueSnackbar('Person created successfully', { variant: 'success' });
      setCreateDialogOpen(false);
      setNewPersonName('');
      setNewPersonDescription('');
      await loadPeople();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to create person', { variant: 'error' });
    }
  };

  const handleDeletePerson = async (person: Person) => {
    if (!window.confirm(`Are you sure you want to delete "${person.name}"?`)) {
      return;
    }

    try {
      await peopleService.deletePerson(person.id);
      enqueueSnackbar('Person deleted successfully', { variant: 'success' });
      await loadPeople();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to delete person', { variant: 'error' });
    }
  };

  const handleAutoAssign = async () => {
    try {
      await peopleService.autoAssignFaces();
      enqueueSnackbar('Auto-assignment started in background', { variant: 'info' });
      setTimeout(() => loadPeople(), 3000); // Reload after 3 seconds
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to start auto-assignment', { variant: 'error' });
    }
  };

  const handleClusterFaces = () => {
    navigate('/people/cluster');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, person: Person) => {
    setAnchorEl(event.currentTarget);
    setSelectedPerson(person);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPerson(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">People</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<GroupWork />}
            onClick={handleClusterFaces}
          >
            Cluster Faces
          </Button>
          <Button
            variant="outlined"
            startIcon={<AutoAwesome />}
            onClick={handleAutoAssign}
          >
            Auto-Assign
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Person
          </Button>
        </Box>
      </Box>

      {people.length === 0 ? (
        <Alert severity="info">
          No people found. Create a person and start tagging faces!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {people.map((person) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={person.id}>
              <Card>
                <CardActionArea onClick={() => navigate(`/people/${person.id}`)}>
                  {person.thumbnailPath ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={person.thumbnailPath}
                      alt={person.name}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.200',
                      }}
                    >
                      <PersonAdd sx={{ fontSize: 80, color: 'grey.400' }} />
                    </Box>
                  )}
                </CardActionArea>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" noWrap>
                        {person.name}
                      </Typography>
                      {person.description && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {person.description}
                        </Typography>
                      )}
                      <Chip
                        label={`${person.faceCount} photos`}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, person)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Person Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Add New Person</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={newPersonDescription}
            onChange={(e) => setNewPersonDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePerson} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Person Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedPerson) {
            navigate(`/people/${selectedPerson.id}`);
          }
          handleMenuClose();
        }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedPerson) {
            handleDeletePerson(selectedPerson);
          }
          handleMenuClose();
        }}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PeopleView;
