import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FolderArchive,
  Plus,
  Download,
  Pencil,
  Trash2,
  History,
  Upload,
  FileText,
  HardDrive,
} from 'lucide-react';
import DocumentFormModal, { DOCUMENT_CATEGORY_LABEL } from '../components/DocumentFormModal';
import DocumentVersionsModal from '../components/DocumentVersionsModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  Toolbar,
  SearchInput,
  StatTile,
  Table,
  THead,
  TBody,
  TR,
  TD,
  TDPrimary,
  TDActions,
  Badge,
  Button,
  IconButton,
  Alert,
  TableSkeleton,
  EmptyState,
} from '../components/ui';
import {
  searchDocuments,
  deleteDocument,
  downloadDocument,
} from '../services/documentService';
import { DOCUMENT_DELETE_ROLES, hasRole } from '../utils/roles';

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

function formatSize(bytes) {
  if (!bytes) return '—';
  const units = ['o', 'Ko', 'Mo', 'Go'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

/**
 * CdC §2.10 — Archivage documentaire.
 * Structuration par catégorie / événement / date, upload, téléchargement,
 * recherche et historisation des versions.
 */
export default function DocumentsPage({ user }) {
  const [documents, setDocuments] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [versionsTarget, setVersionsTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const toast = useToasts();

  // Reaching this page already means the user holds one of INTERNAL_MODULE_ROLES
  // (route guard + backend class-level rule), which is exactly who may upload and
  // edit metadata. Only deletion is further restricted.
  const canDelete = hasRole(user, DOCUMENT_DELETE_ROLES);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadDocuments = useCallback(() => {
    setLoading(true);
    setError(null);
    searchDocuments({
      query: debouncedSearch || undefined,
      category: category || undefined,
      page: 0,
      size: 100,
    })
      .then((res) => {
        setDocuments(res.content);
        setTotalElements(res.totalElements);
      })
      .catch((err) => setError(friendlyError(err, 'Échec du chargement des documents')))
      .finally(() => setLoading(false));
  }, [debouncedSearch, category]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const stats = useMemo(() => {
    const totalSize = documents.reduce((sum, d) => sum + (d.sizeBytes ?? 0), 0);
    const versioned = documents.filter((d) => (d.currentVersion ?? 1) > 1).length;
    return { totalSize, versioned };
  }, [documents]);

  async function handleDownload(doc) {
    setDownloadingId(doc.id);
    try {
      await downloadDocument(doc.id, doc.originalFileName);
    } catch (err) {
      toast.error(friendlyError(err, 'Échec du téléchargement'));
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDocument(deleteTarget.id);
      toast.success('Document archivé (suppression logique).');
      setDeleteTarget(null);
      loadDocuments();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la suppression'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <PageHeader
        eyebrow="Archivage documentaire"
        title="Documents du laboratoire"
        description="Mémoire administrative du LIAS : demandes de financement, programmes, attestations, rapports et documents administratifs, classés par catégorie et par événement. Chaque remplacement de fichier crée une nouvelle version, l'historique complet est conservé."
        actions={
          <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Archiver un document
          </Button>
        }
      />

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatTile label="Documents archivés" value={totalElements} icon={FolderArchive} loading={loading} />
        <StatTile
          label="Documents versionnés"
          value={stats.versioned}
          hint={stats.versioned > 0 ? 'Avec au moins deux versions' : 'Aucune révision pour le moment'}
          icon={History}
          loading={loading}
        />
        <StatTile label="Volume stocké" value={formatSize(stats.totalSize)} icon={HardDrive} loading={loading} />
      </div>

      <Card>
        <Toolbar>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre ou mots-clés..."
            className="w-full sm:w-80"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-lias-border rounded-lg px-3 py-2 text-[13px] outline-none bg-lias-surface
              cursor-pointer hover:border-lias-border-strong focus:border-lias-blue transition-colors duration-150
              w-full sm:w-auto"
          >
            <option value="">Toutes les catégories</option>
            {Object.entries(DOCUMENT_CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="sm:ml-auto text-[12.5px] text-lias-muted">
            {loading ? '—' : `${documents.length} document(s) affiché(s)`}
          </div>
        </Toolbar>

        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FolderArchive}
            title="Aucun document"
            description={
              debouncedSearch || category
                ? 'Aucun document ne correspond à ces critères de recherche.'
                : "L'archive documentaire est vide. Commencez par y déposer un premier document."
            }
            action={
              !debouncedSearch && !category ? (
                <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
                  Archiver un document
                </Button>
              ) : null
            }
          />
        ) : (
          <Table minWidth="min-w-[900px]">
            <THead
              columns={[
                'Document',
                'Catégorie',
                'Version',
                'Taille',
                'Ajouté le',
                { label: 'Actions', align: 'right' },
              ]}
            />
            <TBody>
              {documents.map((doc) => (
                <TR key={doc.id}>
                  <TDPrimary
                    title={
                      <span className="flex items-center gap-2">
                        <FileText size={14} className="text-lias-faint shrink-0" />
                        {doc.title}
                      </span>
                    }
                    subtitle={doc.tags || doc.originalFileName}
                  />
                  <TD>
                    <Badge tone="info" size="sm">
                      {DOCUMENT_CATEGORY_LABEL[doc.category] ?? doc.category}
                    </Badge>
                  </TD>
                  <TD>
                    <span className="font-mono text-[12.5px] text-lias-muted">v{doc.currentVersion ?? 1}</span>
                  </TD>
                  <TD className="text-lias-muted">{formatSize(doc.sizeBytes)}</TD>
                  <TD className="text-lias-muted font-mono text-[12.5px]">
                    {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                  </TD>
                  <TDActions>
                    <IconButton
                      icon={Download}
                      label="Télécharger"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                    />
                    <IconButton
                      icon={History}
                      label="Versions"
                      onClick={() => setVersionsTarget(doc)}
                    />
                    <IconButton
                      icon={Pencil}
                      label="Modifier les métadonnées"
                      onClick={() => { setEditing(doc); setFormOpen(true); }}
                    />
                    {canDelete && (
                      <IconButton
                        icon={Trash2}
                        label="Supprimer"
                        variant="danger"
                        onClick={() => setDeleteTarget(doc)}
                      />
                    )}
                  </TDActions>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <div className="mt-4 flex items-start gap-2 text-[12px] text-lias-muted">
        <Upload size={13} className="mt-0.5 shrink-0" />
        <span>
          Remplacer le fichier d'un document se fait depuis l'historique des versions : l'ancien fichier
          reste consultable, conformément à la règle « aucune donnée n'est perdue » du cahier des charges.
        </span>
      </div>

      <DocumentFormModal
        open={formOpen}
        document={editing}
        onClose={() => setFormOpen(false)}
        onSaved={loadDocuments}
        toast={toast}
      />

      <DocumentVersionsModal
        document={versionsTarget}
        onClose={() => setVersionsTarget(null)}
        onUploaded={loadDocuments}
        toast={toast}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer le document"
        message={`Le document « ${deleteTarget?.title} » sera archivé (suppression logique). Ses versions restent conservées en base.`}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
