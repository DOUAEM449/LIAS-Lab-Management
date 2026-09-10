import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  FileText,
  CalendarRange,
  Users2,
  Download,
} from 'lucide-react';
import PublicationFormModal from '../components/PublicationFormModal';
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
  TableSkeleton,
  BarChart,
} from '../components/ui';
import { searchPublications, deletePublication } from '../services/publicationService';
import { listTeams } from '../services/governanceService';
import { MANAGEMENT_ROLES, hasRole } from '../utils/roles';

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

/**
 * CdC §2.12 — gestion des publications.
 * Ajout par les membres et les doctorants, consultation globale, classement par
 * auteur, année et équipe.
 */
export default function PublicationsPage({ user }) {
  const canDelete = hasRole(user, MANAGEMENT_ROLES);

  const [publications, setPublications] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [teams, setTeams] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToasts();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    listTeams()
      .then(setTeams)
      .catch(() => setTeams([]));
  }, []);

  const loadPublications = useCallback(() => {
    setLoading(true);
    setError(null);
    searchPublications({
      query: debouncedSearch || undefined,
      year: yearFilter ? Number(yearFilter) : undefined,
      teamId: teamFilter || undefined,
      page: 0,
      size: 100,
      sort: 'year,desc',
    })
      .then((res) => {
        setPublications(res.content);
        setTotalElements(res.totalElements);
      })
      .catch((err) => setError(friendlyError(err, 'Échec du chargement des publications')))
      .finally(() => setLoading(false));
  }, [debouncedSearch, yearFilter, teamFilter]);

  useEffect(() => {
    loadPublications();
  }, [loadPublications]);

  const currentYear = new Date().getFullYear();

  const stats = useMemo(() => {
    const thisYear = publications.filter((p) => p.year === currentYear).length;
    const authors = new Set();
    publications.forEach((p) => p.authors?.forEach((a) => authors.add(a.memberId)));
    const withPdf = publications.filter((p) => p.pdfOriginalName).length;
    return { thisYear, authorCount: authors.size, withPdf };
  }, [publications, currentYear]);

  // Five-year distribution from the rows actually loaded — no fabricated series.
  const series = useMemo(() => {
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
    return years.map((y) => ({
      label: String(y),
      value: publications.filter((p) => p.year === y).length,
    }));
  }, [publications, currentYear]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePublication(deleteTarget.id);
      toast.success('Publication archivée.');
      setDeleteTarget(null);
      loadPublications();
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
        eyebrow="Production scientifique"
        title="Publications"
        description="Répertoire des travaux publiés par les membres et doctorants du laboratoire, classés par auteur, année et équipe de recherche."
        actions={
          <Button
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Nouvelle publication
          </Button>
        }
      />

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatTile label="Publications" value={totalElements} icon={BookOpen} loading={loading} />
        <StatTile label={`Publiées en ${currentYear}`} value={stats.thisYear} icon={CalendarRange} loading={loading} />
        <StatTile label="Auteurs distincts" value={stats.authorCount} icon={Users2} loading={loading} />
        <StatTile
          label="Avec PDF déposé"
          value={stats.withPdf}
          hint={
            publications.length > 0
              ? `${Math.round((stats.withPdf / publications.length) * 100)}% du corpus`
              : undefined
          }
          icon={FileText}
          loading={loading}
        />
      </div>

      <Card className="mb-5">
        <div className="px-5.5 py-4 border-b border-lias-border-light">
          <h2 className="m-0 text-[14.5px] font-semibold text-lias-navy">Répartition sur cinq ans</h2>
          <p className="m-0 mt-1 text-[12.5px] text-lias-muted">
            Nombre de publications par année, sur les résultats affichés.
          </p>
        </div>
        <div className="px-5.5 py-5">
          <BarChart data={series} height={130} emptyLabel="Aucune publication sur les cinq dernières années" />
        </div>
      </Card>

      <Card>
        <Toolbar>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, mots-clés, DOI..."
            className="w-full sm:w-80"
          />
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="border border-lias-border rounded-lg px-3 py-2 text-[13px] outline-none bg-lias-surface
              cursor-pointer hover:border-lias-border-strong focus:border-lias-blue transition-colors duration-150"
          >
            <option value="">Toutes les équipes</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            placeholder="Année"
            className="border border-lias-border rounded-lg px-3 py-2 text-[13px] w-full sm:w-28 outline-none
              bg-lias-surface hover:border-lias-border-strong focus:border-lias-blue transition-colors duration-150"
          />
          <div className="sm:ml-auto text-[12.5px] text-lias-muted">
            {loading ? '—' : `${publications.length} résultat(s)`}
          </div>
        </Toolbar>

        {loading ? (
          <TableSkeleton rows={5} columns={3} />
        ) : publications.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Aucune publication"
            description={
              debouncedSearch || yearFilter || teamFilter
                ? 'Aucune publication ne correspond à ces critères.'
                : "Le répertoire est vide. Ajoutez la première publication du laboratoire."
            }
            action={
              !debouncedSearch && !yearFilter && !teamFilter ? (
                <Button
                  icon={Plus}
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  Ajouter une publication
                </Button>
              ) : null
            }
          />
        ) : (
          /* Academic reference list rather than a raw grid — closer to how a
             laboratory actually presents its bibliography. */
          <ul className="list-none p-0 m-0">
            {publications.map((p) => (
              <li
                key={p.id}
                className="flex items-start gap-4 px-5.5 py-4 border-b border-lias-border-light last:border-b-0
                  hover:bg-lias-surface-muted/50 transition-colors duration-150"
              >
                <div className="w-11 shrink-0 text-center pt-0.5">
                  <div className="text-[15px] font-bold text-lias-blue-dark font-mono leading-none">{p.year}</div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="m-0 text-[13.5px] font-semibold text-lias-ink leading-snug">{p.title}</h3>
                  <p className="mt-1 mb-0 text-[12.5px] text-lias-muted">
                    {p.authors?.map((a) => a.fullName).join(', ') || 'Auteurs non spécifiés'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {p.teamName && (
                      <Badge tone="info" size="sm">
                        {p.teamName}
                      </Badge>
                    )}
                    {p.pdfOriginalName && (
                      <Badge tone="success" icon={Download} size="sm">
                        PDF
                      </Badge>
                    )}
                    {p.doi && (
                      <span className="text-[11.5px] text-lias-faint font-mono truncate">DOI : {p.doi}</span>
                    )}
                    {p.keywords && (
                      <span className="text-[11.5px] text-lias-faint truncate">{p.keywords}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <IconButton
                    icon={Pencil}
                    label="Modifier"
                    onClick={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                  />
                  {canDelete && (
                    <IconButton
                      icon={Trash2}
                      label="Archiver"
                      variant="danger"
                      onClick={() => setDeleteTarget(p)}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <PublicationFormModal
        open={formOpen}
        publication={editing}
        onClose={() => setFormOpen(false)}
        onSaved={loadPublications}
        toast={toast}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archiver la publication"
        message={`« ${deleteTarget?.title} » sera archivée (suppression logique). Le lien avec ses auteurs est conservé.`}
        confirmLabel="Archiver"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
