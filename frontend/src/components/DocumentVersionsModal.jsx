import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, History, Upload } from 'lucide-react';
import Modal from './Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Alert, EmptyState, LoadingBlock } from './ui/Feedback';
import {
  listDocumentVersions,
  uploadDocumentVersion,
  downloadDocumentVersion,
} from '../services/documentService';

/**
 * Version history of an archived document (CdC §2.10 — "Historisation").
 * Uploading a replacement never overwrites: it opens a new version and the
 * previous files stay downloadable.
 */
export default function DocumentVersionsModal({ document, onClose, onUploaded, toast }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = useCallback(() => {
    if (!document) return;
    setLoading(true);
    setError(null);
    listDocumentVersions(document.id)
      .then(setVersions)
      .catch((err) =>
        setError(err.response?.data?.message || "Échec du chargement de l'historique des versions")
      )
      .finally(() => setLoading(false));
  }, [document]);

  useEffect(() => {
    setVersions([]);
    load();
  }, [load]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadDocumentVersion(document.id, file);
      toast?.success('Nouvelle version enregistrée.');
      load();
      onUploaded?.();
    } catch (err) {
      toast?.error(
        err.response?.status === 403
          ? "Vous n'avez pas les droits nécessaires pour cette action."
          : err.response?.data?.message || "Échec de l'envoi de la nouvelle version"
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDownload(version) {
    try {
      await downloadDocumentVersion(version.id, version.originalFileName);
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Échec du téléchargement');
    }
  }

  return (
    <Modal
      open={Boolean(document)}
      title="Historique des versions"
      subtitle={document?.title}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingBlock label="Chargement de l'historique..." />
      ) : versions.length === 0 ? (
        <EmptyState icon={History} title="Aucune version enregistrée" />
      ) : (
        <ul className="list-none p-0 m-0">
          {versions.map((v, index) => (
            <li
              key={v.id}
              className="relative pl-6 pb-4 last:pb-0 lias-timeline"
            >
              <span
                className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-lias-surface
                  ${index === 0 ? 'bg-lias-blue' : 'bg-lias-border-strong'}`}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-lias-ink font-mono">
                      v{v.versionNumber}
                    </span>
                    {index === 0 && (
                      <Badge tone="success" size="sm">
                        Version courante
                      </Badge>
                    )}
                  </div>
                  <div className="text-[12.5px] text-lias-muted mt-0.5 truncate">
                    {v.originalFileName || 'Fichier sans nom'}
                  </div>
                  <div className="text-[11.5px] text-lias-faint mt-0.5">
                    {new Date(v.uploadedAt).toLocaleString('fr-FR')}
                  </div>
                </div>
                <Button size="sm" variant="secondary" icon={Download} onClick={() => handleDownload(v)}>
                  Télécharger
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 pt-5 border-t border-lias-border-light">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleUpload}
          className="hidden"
          id="new-document-version"
        />
        <Button
          icon={Upload}
          variant="secondary"
          loading={uploading}
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          Déposer une nouvelle version
        </Button>
        <p className="text-[11.5px] text-lias-muted mt-2.5 mb-0 text-center">
          L'ancienne version reste conservée et téléchargeable.
        </p>
      </div>
    </Modal>
  );
}
