import { useCallback, useEffect, useMemo, useState } from 'react';
import { Handshake, Plus, Pencil, Trash2, Globe2, FileSignature, Building2, Mail } from 'lucide-react';
import PartnerFormModal from '../components/PartnerFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  Toolbar,
  SearchInput,
  StatTile,
  Button,
  IconButton,
  Badge,
  Alert,
  EmptyState,
  Skeleton,
} from '../components/ui';
import {
  searchPartners,
  deletePartner,
  listAgreementsByPartner,
} from '../services/partnershipService';

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

/**
 * CdC §2.16 — conventions & collaborations.
 * Partenaires institutionnels et industriels, conventions signées et documents
 * associés (gérés dans la fiche du partenaire).
 */
export default function PartenariatsPage() {
  const [partners, setPartners] = useState([]);
  const [agreementCounts, setAgreementCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToasts();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadPartners = useCallback(() => {
    setLoading(true);
    setError(null);
    searchPartners({ query: debouncedSearch || undefined })
      .then((res) => {
        setPartners(res.content);
        // Convention counts per partner — a handful of extra calls at this scale,
        // and it makes the collaboration volume visible at a glance.
        return Promise.all(
          res.content.map((p) =>
            listAgreementsByPartner(p.id)
              .then((list) => [p.id, list.length])
              .catch(() => [p.id, 0])
          )
        );
      })
      .then((entries) => setAgreementCounts(Object.fromEntries(entries)))
      .catch((err) => setError(friendlyError(err, 'Échec du chargement des partenaires')))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const stats = useMemo(() => {
    const countries = new Set(partners.map((p) => p.country).filter(Boolean));
    const totalAgreements = Object.values(agreementCounts).reduce((s, n) => s + n, 0);
    return { countries: countries.size, totalAgreements };
  }, [partners, agreementCounts]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePartner(deleteTarget.id);
      toast.success('Partenaire archivé.');
      setDeleteTarget(null);
      loadPartners();
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
        eyebrow="Collaborations"
        title="Conventions & partenariats"
        description="Partenaires académiques et industriels du laboratoire, conventions signées et documents contractuels archivés."
        actions={
          <Button
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Nouveau partenaire
          </Button>
        }
      />

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatTile label="Partenaires" value={partners.length} icon={Handshake} loading={loading} />
        <StatTile
          label="Conventions signées"
          value={stats.totalAgreements}
          hint="Tous partenaires confondus"
          icon={FileSignature}
          loading={loading}
        />
        <StatTile label="Pays représentés" value={stats.countries} icon={Globe2} loading={loading} />
      </div>

      <Card className="mb-5">
        <Toolbar>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un partenaire..."
            className="w-full sm:w-80"
          />
          <div className="sm:ml-auto text-[12.5px] text-lias-muted">
            {loading ? '—' : `${partners.length} partenaire(s)`}
          </div>
        </Toolbar>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-card" />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <Card>
          <EmptyState
            icon={Handshake}
            title="Aucun partenaire"
            description={
              debouncedSearch
                ? 'Aucun partenaire ne correspond à cette recherche.'
                : "Enregistrez les collaborations académiques et industrielles du laboratoire."
            }
            action={
              !debouncedSearch ? (
                <Button
                  icon={Plus}
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  Ajouter un partenaire
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {partners.map((p) => {
            const count = agreementCounts[p.id] ?? 0;
            return (
              <Card key={p.id} className="p-5 flex flex-col">
                <div className="flex items-start gap-4">
                  {p.logoPath ? (
                    <img
                      src={`/files/${p.logoPath}`}
                      alt=""
                      className="w-12 h-12 rounded-lg object-contain bg-lias-surface-muted border border-lias-border-light shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-lias-blue-tint-solid flex items-center justify-center shrink-0">
                      <Building2 size={20} className="text-lias-blue-dark" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="m-0 text-[14.5px] font-semibold text-lias-navy leading-snug">{p.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {p.type && (
                        <Badge tone="info" size="sm">
                          {p.type}
                        </Badge>
                      )}
                      {p.country && (
                        <span className="flex items-center gap-1 text-[11.5px] text-lias-muted">
                          <Globe2 size={11} />
                          {p.country}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {p.contactInfo && (
                  <p className="flex items-start gap-1.5 text-[12.5px] text-lias-muted mt-4 mb-0 leading-relaxed">
                    <Mail size={12} className="mt-0.5 shrink-0" />
                    <span className="min-w-0 break-words">{p.contactInfo}</span>
                  </p>
                )}

                <div className="flex items-center justify-between gap-3 mt-auto pt-4 mt-4 border-t border-lias-border-light">
                  <Badge tone={count > 0 ? 'success' : 'neutral'} icon={FileSignature} size="sm">
                    {count} convention(s)
                  </Badge>
                  <div className="flex gap-2">
                    <IconButton
                      icon={Pencil}
                      label="Gérer le partenaire et ses conventions"
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                    />
                    <IconButton
                      icon={Trash2}
                      label="Archiver"
                      variant="danger"
                      onClick={() => setDeleteTarget(p)}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PartnerFormModal
        open={formOpen}
        partner={editing}
        onClose={() => setFormOpen(false)}
        onSaved={loadPartners}
        toast={toast}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archiver le partenaire"
        message={`« ${deleteTarget?.name} » sera archivé (suppression logique). Les conventions et documents associés restent conservés.`}
        confirmLabel="Archiver"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
