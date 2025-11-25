import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Breadcrumbs,
  Link,
  Chip,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  PersonAdd,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import peopleService, { Face, Person } from '@/services/peopleService';
import { useNavigate } from 'react-router-dom';

const FaceClusterView: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [clusters, setClusters] = useState<Face[][]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<Face[] | null>(null);
  const [newPersonName, setNewPersonName] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clustersData, peopleData] = await Promise.all([
        peopleService.clusterUnassignedFaces(),
        peopleService.getAllPeople(),
      ]);
      setClusters(clustersData);
      setPeople(peopleData);
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to load face clusters', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignDialog = (cluster: Face[]) => {
    setSelectedCluster(cluster);
    setAssignDialogOpen(true);
    setNewPersonName('');
    setSelectedPersonId(null);
  };

  const handleAssignCluster = async () => {
    if (!selectedCluster) return;

    try {
      let personId = selectedPersonId;

      // Create new person if name is provided
      if (newPersonName.trim()) {
        const newPerson = await peopleService.createPerson(newPersonName);
        personId = newPerson.id;
      }

      if (!personId) {
        enqueueSnackbar('Please select or create a person', { variant: 'error' });
        return;
      }

      // Assign all faces in cluster
      await Promise.all(
        selectedCluster.map((face) =>
          peopleService.assignFace(face.id, personId!)
        )
      );

      enqueueSnackbar('Faces assigned successfully', { variant: 'success' });
      setAssignDialogOpen(false);
      await loadData();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to assign faces', { variant: 'error' });
    }
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
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/people')}
          sx={{ textDecoration: 'none', cursor: 'pointer' }}
        >
          People
        </Link>
        <Typography color="text.primary">Cluster Faces</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Face Clusters</Typography>
          <Typography variant="body2" color="text.secondary">
            Groups of similar faces detected in your photos
          </Typography>
        </Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/people')}
        >
          Back to People
        </Button>
      </Box>

      {clusters.length === 0 ? (
        <Alert severity="info">
          No face clusters found. Upload more photos with people to see suggestions!
        </Alert>
      ) : (
        <Box>
          {clusters.map((cluster, index) => (
            <Card key={index} sx={{ mb: 3, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6">Cluster {index + 1}</Typography>
                  <Chip label={`${cluster.length} faces`} size="small" />
                </Box>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => handleOpenAssignDialog(cluster)}
                >
                  Assign to Person
                </Button>
              </Box>
              <Grid container spacing={1}>
                {cluster.map((face) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={face.id}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="120"
                        image={`/api/media/${face.mediaId}/thumbnail/300`}
                        alt={`Face ${face.id}`}
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Card>
          ))}
        </Box>
      )}

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Faces to Person</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a new person or select an existing one to assign these {selectedCluster?.length || 0} faces
          </Typography>

          <TextField
            autoFocus
            margin="dense"
            label="New Person Name"
            fullWidth
            value={newPersonName}
            onChange={(e) => {
              setNewPersonName(e.target.value);
              setSelectedPersonId(null); // Clear existing person selection
            }}
            placeholder="e.g., John Smith"
          />

          <Typography variant="body2" sx={{ my: 2, textAlign: 'center' }}>
            OR
          </Typography>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Select Existing Person:
            </Typography>
            <Grid container spacing={1}>
              {people.map((person) => (
                <Grid item xs={6} sm={4} key={person.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedPersonId === person.id ? 2 : 0,
                      borderColor: 'primary.main',
                    }}
                    onClick={() => {
                      setSelectedPersonId(person.id);
                      setNewPersonName(''); // Clear new person name
                    }}
                  >
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <PersonAdd sx={{ fontSize: 40, color: 'grey.400' }} />
                      <Typography variant="body2" noWrap>
                        {person.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {person.faceCount} photos
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignCluster}
            variant="contained"
            disabled={!newPersonName.trim() && !selectedPersonId}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FaceClusterView;
