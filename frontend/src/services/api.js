import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
});

// Tasks
export const fetchTasks = async () => {
    const response = await api.get('/tasks');
    return response.data;
};

export const createTask = async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
};

// Predictions
export const predictOutcome = async (predictionInput) => {
    const response = await api.post('/predict', predictionInput);
    return response.data;
};

// Subjects
export const fetchSubjects = async () => {
    const response = await api.get('/subjects');
    return response.data;
};

export const updateSubject = async (subjectData) => {
    const response = await api.post('/subjects', subjectData);
    return response.data;
};

export default api;
