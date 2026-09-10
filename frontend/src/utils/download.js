import api from '../services/api';

/**
 * Downloads a protected file through the authenticated API.
 *
 * Stored files (documents, procès-verbaux, generated reports) live outside the
 * public `/files/public/**` space, so a plain <a href> cannot reach them: the
 * browser would not attach the JWT bearer token. We therefore fetch the file as
 * a blob with the normal axios instance — interceptor and token included — and
 * hand it to the browser through a temporary object URL.
 */
export async function downloadFile(url, fallbackFileName = 'document') {
  const res = await api.get(url, { responseType: 'blob' });

  // Prefer the file name the backend advertises in Content-Disposition.
  const disposition = res.headers['content-disposition'] ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const fileName = match ? decodeURIComponent(match[1]) : fallbackFileName;

  const objectUrl = window.URL.createObjectURL(new Blob([res.data], { type: res.data.type }));
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}
