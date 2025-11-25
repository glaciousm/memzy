import api from './api';

export interface Face {
  id: number;
  mediaId: number;
  personId?: number;
  personName?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  isVerified: boolean;
  detectedAt: string;
}

export interface Person {
  id: number;
  name: string;
  description?: string;
  thumbnailPath?: string;
  faceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersonSuggestion {
  personId: number;
  personName: string;
  similarity: number;
  faceCount: number;
}

const peopleService = {
  // People management
  getAllPeople: async (): Promise<Person[]> => {
    const response = await api.get('/people');
    return response.data;
  },

  getPersonById: async (id: number): Promise<Person> => {
    const response = await api.get(`/people/${id}`);
    return response.data;
  },

  createPerson: async (name: string, description?: string): Promise<Person> => {
    const response = await api.post('/people', { name, description });
    return response.data;
  },

  updatePerson: async (id: number, name: string, description?: string): Promise<Person> => {
    const response = await api.put(`/people/${id}`, { name, description });
    return response.data;
  },

  deletePerson: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/people/${id}`);
    return response.data;
  },

  getPersonFaces: async (id: number): Promise<Face[]> => {
    const response = await api.get(`/people/${id}/faces`);
    return response.data;
  },

  mergePeople: async (id1: number, id2: number, newName: string): Promise<Person> => {
    const response = await api.post(`/people/${id1}/merge/${id2}`, { name: newName });
    return response.data;
  },

  // Face management
  assignFace: async (faceId: number, personId: number): Promise<Face> => {
    const response = await api.post(`/people/faces/${faceId}/assign`, { personId });
    return response.data;
  },

  unassignFace: async (faceId: number): Promise<Face> => {
    const response = await api.post(`/people/faces/${faceId}/unassign`);
    return response.data;
  },

  getSuggestionsForFace: async (faceId: number): Promise<PersonSuggestion[]> => {
    const response = await api.get(`/people/faces/${faceId}/suggestions`);
    return response.data;
  },

  getUnassignedFaces: async (): Promise<Face[]> => {
    const response = await api.get('/people/faces/unassigned');
    return response.data;
  },

  // Auto-assignment and clustering
  autoAssignFaces: async (): Promise<{ message: string }> => {
    const response = await api.post('/people/auto-assign');
    return response.data;
  },

  clusterUnassignedFaces: async (): Promise<Face[][]> => {
    const response = await api.post('/people/cluster');
    return response.data;
  },
};

export default peopleService;
