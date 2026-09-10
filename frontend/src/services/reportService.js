import api from './api';
import { downloadFile } from '../utils/download';

export async function listReports() {
  const res = await api.get('/reports');
  return res.data.data;
}

export async function getReport(year) {
  const res = await api.get(`/reports/${year}`);
  return res.data.data;
}

export async function generateReport(year) {
  const res = await api.post(`/reports/${year}/generate`);
  return res.data.data;
}

export async function deleteReport(id) {
  await api.delete(`/reports/${id}`);
}

/** CdC §2.11 — export of the annual activity report as a PDF document. */
export function downloadReportPdf(year) {
  return downloadFile(`/reports/${year}/pdf`, `rapport-activite-${year}.pdf`);
}
