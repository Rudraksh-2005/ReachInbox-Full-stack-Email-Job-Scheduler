import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const scheduleEmails = async (data: any) => {
  const response = await api.post('/emails/schedule', data);
  return response.data;
};

export const getScheduledEmails = async (userId: string) => {
  const response = await api.get(`/emails/scheduled?userId=${userId}`);
  return response.data.emails;
};

export const getSentEmails = async (userId: string) => {
  const response = await api.get(`/emails/sent?userId=${userId}`);
  return response.data.emails;
};

export const searchEmails = async (query: string) => {
  const response = await api.get(`/emails/search?q=${query}`);
  return response.data.emails;
};

export const deleteEmail = async (id: string) => {
  const response = await api.delete(`/emails/${id}`);
  return response.data;
};
