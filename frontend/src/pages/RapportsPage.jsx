import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileBarChart,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  Sparkles,
  CalendarCheck,
  Info,
  Users,
  BookOpen,
  Calendar,
  UserCheck,
  UserX,
  Package,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { TextField } from '../components/FormField';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  CardHeader,
  StatTile,
  Button,
  IconButton,
  Badge,
  Alert,
  EmptyState,
  LoadingBlock,
  BarChart,
} from '../components/ui';
import { listReports, generateReport, deleteReport, downloadReportPdf } from '../services/reportService';

const STAT_META = {
  totalMembers: { label: 'Membres au total', icon: Users },
  totalPublicationsThisYear: { label: "Publications de l'année", icon: BookOpen },
  totalEventsThisYear: { label: "Événements de l'année", icon: Calendar },
  approvedMembershipRequestsThisYear: { label: 'Adhésions acceptées', icon: UserCheck },
  rejectedMembershipRequestsThisYear: { label: 'Adhésions refusées', icon: UserX },
  equipmentRequestsThisYear: { label: 'Demandes de matériel', icon: Package },
};

function friendlyError(err, fallback) {
  if (err.response?.status === 409) return 'Un rapport existe déjà pour cette année.';
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

/**
 * CdC §2.11 — rapport d'activité annuel.
 * Généré automatiquement chaque 1er janvier pour l'année écoulée, et
 * générable manuellement ici. Exportable en PDF, document conditionnant
 * le budget annuel du laboratoire.
 */
export default function RapportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [genYear, setGenYear] = useState(new Date().getFullYear() - 1);
  const [generating, setGenerating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingYear, setDownloadingYear] = useState(null);

  const toast = useToasts();

  const loadReports = useCallback(() => {
    setLoading(true);
    setError(null);
    listReports()
      .then(setReports)
      .catch((err) => setError(friendlyError(err, 'Échec du chargement des rapports')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const sorted = useMemo(() => [...reports].sort((a, b) => b.year - a.year), [reports]);
  const latest = sorted[0];

  // Publication trend across the generated reports — real stored statistics.
  const trend = useMemo(
    () =>
      [...sorted]
        .reverse()
        .slice(-5)
        .map((r) => ({ label: String(r.year), value: r.statistics?.totalPublicationsThisYear ?? 0 })),
    [sorted]
  );

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      await generateReport(Number(genYear));
      toast.success(`Rapport ${genYear} généré, PDF inclus.`);
      loadReports();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la génération du rapport'));
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload(report) {
    setDownloadingYear(report.year);
    try {
      await downloadReportPdf(report.year);
    } catch (err) {
      toast.error(friendlyError(err, 'Échec du téléchargement du PDF'));
    } finally {
      setDownloadingYear(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteReport(deleteTarget.id);
      toast.success('Rapport archivé.');
      setDeleteTarget(null);
      loadReports();
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
        eyebrow="Pilotage"
        title="Rapports d'activité annuels"
        description="Synthèse annuelle de l'activité scientifique et administrative du laboratoire — le document qui conditionne le budget de l'année suivante."
      />

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      <Alert tone="info" className="mb-6" title="Génération automatique">
        Le rapport de l'année écoulée est produit automatiquement le 1<sup>er</sup> janvier. Vous pouvez
        également le générer manuellement ci-dessous ; l'export PDF est créé en même temps.
      </Alert>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatTile label="Rapports générés" value={reports.length} icon={FileBarChart} loading={loading} />
        <StatTile
          label="Dernier exercice couvert"
          value={latest ? latest.year : '—'}
          hint={latest ? `Généré le ${new Date(latest.generatedDate).toLocaleDateString('fr-FR')}` : 'Aucun rapport'}
          icon={CalendarCheck}
          loading={loading}
        />
        <StatTile
          label="Publications (dernier rapport)"
          value={latest?.statistics?.totalPublicationsThisYear ?? 0}
          icon={BookOpen}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5 mb-5">
        <Card padded>
          <div className="flex items-center gap-2 text-[13.5px] font-semibold text-lias-navy mb-1.5">
            <Sparkles size={15} className="text-lias-blue-dark" />
            Générer un rapport
          </div>
          <p className="text-[12.5px] text-lias-muted mt-0 mb-4 leading-relaxed">
            Agrège les chiffres réels de l'année : membres, publications, événements, adhésions
            instruites et demandes de matériel.
          </p>
          <form onSubmit={handleGenerate}>
            <TextField
              label="Année de l'exercice"
              type="number"
              min={2000}
              max={new Date().getFullYear()}
              required
              value={genYear}
              onChange={(e) => setGenYear(e.target.value)}
            />
            <Button type="submit" icon={Sparkles} loading={generating} className="w-full">
              Générer le rapport {genYear}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader
            icon={BookOpen}
            title="Évolution de la production scientifique"
            description="Publications par exercice, d'après les rapports générés"
          />
          <div className="px-5.5 py-5">
            <BarChart
              data={trend}
              height={140}
              emptyLabel="Générez au moins un rapport pour visualiser la tendance"
            />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader icon={FileBarChart} title="Rapports générés" description="Cliquez sur un rapport pour voir le détail de ses indicateurs." />

        {loading ? (
          <LoadingBlock label="Chargement des rapports..." />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={FileBarChart}
            title="Aucun rapport généré"
            description="Générez le rapport de l'exercice écoulé pour disposer du document d'activité annuel."
          />
        ) : (
          <div>
            {sorted.map((r) => (
              <div key={r.id} className="border-b border-lias-border-light last:border-b-0">
                <div
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="flex items-center justify-between gap-4 px-5.5 py-4 cursor-pointer
                    hover:bg-lias-surface-muted/60 transition-colors duration-150"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-lias-blue-tint-solid flex flex-col items-center justify-center shrink-0">
                      <span className="text-[13px] font-bold text-lias-blue-dark font-mono leading-none">
                        {r.year}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-lias-ink">
                        Rapport d'activité {r.year}
                      </div>
                      <div className="text-[12px] text-lias-muted mt-0.5">
                        Généré le {new Date(r.generatedDate).toLocaleDateString('fr-FR')}
                        {r.pdfPath && (
                          <>
                            {' — '}
                            <Badge tone="success" size="sm">
                              PDF disponible
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Download}
                      loading={downloadingYear === r.year}
                      onClick={() => handleDownload(r)}
                    >
                      PDF
                    </Button>
                    <IconButton
                      icon={Trash2}
                      label="Archiver le rapport"
                      variant="danger"
                      onClick={() => setDeleteTarget(r)}
                    />
                    {expandedId === r.id ? (
                      <ChevronUp size={16} className="text-lias-faint" />
                    ) : (
                      <ChevronDown size={16} className="text-lias-faint" />
                    )}
                  </div>
                </div>

                {expandedId === r.id && (
                  <div className="px-5.5 pb-5 lias-enter">
                    {r.statistics ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(r.statistics).map(([key, value]) => {
                          const meta = STAT_META[key] ?? { label: key, icon: Info };
                          const Icon = meta.icon;
                          return (
                            <div
                              key={key}
                              className="bg-lias-surface-muted/70 border border-lias-border-light rounded-lg px-4 py-3"
                            >
                              <div className="flex items-center gap-2 text-[11.5px] text-lias-muted mb-1.5">
                                <Icon size={12} className="shrink-0" />
                                {meta.label}
                              </div>
                              <div className="text-[19px] font-bold text-lias-navy tabular-nums leading-none">
                                {value}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Alert tone="warning">
                        Les statistiques de ce rapport sont illisibles — régénérez-le pour rétablir le détail.
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archiver le rapport"
        message={`Le rapport d'activité ${deleteTarget?.year} sera archivé (suppression logique). Il pourra être régénéré si nécessaire.`}
        confirmLabel="Archiver"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
