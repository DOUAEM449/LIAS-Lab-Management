import { useCallback, useEffect, useState } from 'react';
import { FileBarChart, Loader2, AlertCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { TextField } from '../components/FormField';
import { ToastStack, useToasts } from '../components/Toast';
import { listReports, generateReport, deleteReport } from '../services/reportService';

const STAT_LABELS = {
  totalMembers: 'Membres au total',
  totalPublicationsThisYear: 'Publications (année)',
  totalEventsThisYear: 'Événements (année)',
  approvedMembershipRequestsThisYear: 'Adhésions acceptées',
  rejectedMembershipRequestsThisYear: 'Adhésions refusées',
  equipmentRequestsThisYear: 'Demandes de matériel',
};

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function RapportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      await generateReport(Number(genYear));
      toast.success(`Rapport ${genYear} généré.`);
      loadReports();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la génération du rapport'));
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteReport(deleteTarget.id);
      toast.success('Rapport supprimé.');
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

      <div className="mb-6">
        <h1 className="m-0 text-[22px] font-bold text-lias-navy">Rapports d'Activité Annuels</h1>
        <p className="mt-1.5 mb-0 text-[13.5px] text-lias-muted">
          Génération automatique des statistiques annuelles du laboratoire.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="bg-white border border-lias-border rounded-xl p-5.5 mb-7">
        <div className="text-sm font-semibold text-lias-navy mb-4">Générer un nouveau rapport</div>
        <form onSubmit={handleGenerate} className="flex items-end gap-4">
          <TextField
            label="Année"
            type="number"
            value={genYear}
            onChange={(e) => setGenYear(e.target.value)}
          />
          <button
            type="submit"
            disabled={generating}
            className="bg-lias-blue text-white border-none rounded-lg py-2.5 px-4 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center gap-2 mb-3.5"
          >
            {generating && <Loader2 size={14} className="animate-spin" />}
            Générer
          </button>
        </form>
      </div>

      <div className="bg-white border border-lias-border rounded-xl overflow-hidden">
        <div className="px-5.5 py-4 border-b border-lias-border-light flex items-center gap-2 text-sm font-semibold text-lias-navy">
          <FileBarChart size={16} />
          Rapports générés
        </div>
        {loading ? (
          <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Chargement...</div>
        ) : reports.length === 0 ? (
          <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Aucun rapport généré.</div>
        ) : (
          <div>
            {reports
              .slice()
              .sort((a, b) => b.year - a.year)
              .map((r) => (
                <div key={r.id} className="border-t border-lias-border-light">
                  <div
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    className="flex items-center justify-between px-5.5 py-3.5 cursor-pointer hover:bg-lias-bg/60"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-lias-ink">Rapport {r.year}</div>
                      <div className="text-[12px] text-lias-muted">
                        Généré le {new Date(r.generatedDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(r);
                        }}
                        className="w-8 h-8 rounded-lg border border-rose-200 bg-white cursor-pointer flex items-center justify-center text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                      {expandedId === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  {expandedId === r.id && r.statistics && (
                    <div className="px-5.5 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(r.statistics).map(([key, value]) => (
                        <div key={key} className="bg-lias-bg rounded-lg px-3 py-2.5">
                          <div className="text-[11px] text-lias-muted">{STAT_LABELS[key] || key}</div>
                          <div className="text-base font-semibold text-lias-navy">{value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer le rapport"
        message={`Voulez-vous vraiment supprimer le rapport ${deleteTarget?.year} ?`}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
