import api from './api';
import { downloadFile } from '../utils/download';

/** CdC §2.10 — archivage documentaire : upload, téléchargement, recherche, historisation. */

export async function searchDocuments({ category, query, page = 0, size = 50, sort = 'createdAt,desc' } = {}) {
  const res = await api.get('/documents', { params: { category, query, page, size, sort } });
  return res.data.data;
}

export async function getDocument(id) {
  const res = await api.get(`/documents/${id}`);
  return res.data.data;
}

export async function uploadDocument(metadata, file) {
  const formData = new FormData();
  // The backend reads the metadata part as JSON (see MultipartJsonPartConfig).
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);
  const res = await api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function uploadDocumentVersion(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/documents/${id}/versions`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function updateDocumentMetadata(id, metadata) {
  const res = await api.put(`/documents/${id}`, metadata);
  return res.data.data;
}

export async function listDocumentVersions(id) {
  const res = await api.get(`/documents/${id}/versions`);
  return res.data.data;
}

export async function deleteDocument(id) {
  await api.delete(`/documents/${id}`);
}

export function downloadDocument(id, fileName) {
  return downloadFile(`/documents/${id}/download`, fileName);
}

export function downloadDocumentVersion(versionId, fileName) {
  return downloadFile(`/documents/versions/${versionId}/download`, fileName);
}
