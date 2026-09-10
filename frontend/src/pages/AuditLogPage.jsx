import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, ShieldCheck, Activity, Fingerprint, RefreshCw, Lock } from 'lucide-react';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  Toolbar,
  SearchInput,
  StatTile,
  Button,
  Badge,
  Alert,
  EmptyState,
  TableSkeleton,
  Table,
  THead,
  TBody,
  TR,
  TD,
} from '../components/ui';
import { listAuditLogs } from '../services/auditService';

const ACTION_LABEL_FR = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  RESTORE: 'Restauration',
  APPROVE: 'Approbation',
  REJECT: 'Rejet',
  LOGIN: 'Connexion',
  LOGIN_FAILED: 'Échec de connexion',
  LOGOUT: 'Déconnexion',
  PASSWORD_RESET: 'Mot de passe réinitialisé',
  ROLE_CHANGE: 'Changement de rôle',
  STATUS_CHANGE: 'Changement de statut',
  FILE_UPLOAD: 'Fichier envoyé',
  FILE_DOWNLOAD: 'Fichier téléchargé',
};

const ACTION_TONE = {
  CREATE: 'success',
  APPROVE: 'success',
  RESTORE: 'success',
  LOGIN: 'info',
  LOGOUT: 'neutral',
  FILE_UPLOAD: 'info',
  FILE_DOWNLOAD: 'info',
  DELETE: 'danger',
  REJECT: 'danger',
  LOGIN_FAILED: 'danger',
  UPDATE: 'warning',
  ROLE_CHANGE: 'mandate',
  STATUS_CHANGE: 'warning',
  PASSWORD_RESET: 'warning',
};

function friendlyError(err, fallback) {
  if (err.response?.status === 403)
    return "Vous n'avez pas les droits nécessaires pour consulter le journal d'audit.";
  return err.response?.data?.message || fallback;
}

/**
 * CdC §2.21 — "toute action importante est traçable".
 * Read-only enterprise audit trail: who did what, on which entity, from which
 * IP, and when. Nothing here can be edited or deleted from the interface.
 */
export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const toast = useToasts();

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listAuditLogs({ page: 0, size: 200 })
      .then((res) => setLogs(res.content))
      .catch((err) => setError(friendlyError(err, 'Échec du chargement du journal')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return logs.filter((l) => {
      const matchesAction = !actionFilter || l.action === actionFilter;
      const matchesQuery =
        !q ||
        l.actorEmail?.toLowerCase().includes(q) ||
        l.entityType?.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q) ||
        l.ipAddress?.toLowerCase().includes(q);
      return matchesAction && matchesQuery;
    });
  }, [logs, filter, actionFilter]);

  const stats = useMemo(() => {
    const actors = new Set(logs.map((l) => l.actorEmail).filter(Boolean));
    const security = logs.filter((l) =>
      ['LOGIN_FAILED', 'ROLE_CHANGE', 'PASSWORD_RESET', 'DELETE'].includes(l.action)
    ).length;
    return { actors: actors.size, security };
  }, [logs]);

  const availableActions = useMemo(
    () => [...new Set(logs.map((l) => l.action))].sort(),
    [logs]
  );

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <PageHeader
        eyebrow="Traçabilité"
        title="Journal d'audit"
        description="Trace intégrale des actions importantes du système : acteur, action, entité concernée, adresse IP et horodatage. Consultation en lecture seule."
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={load} loading={loading}>
            Actualiser
          </Button>
        }
      />

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatTile
          label="Entrées chargées"
          value={logs.length}
          hint="200 dernières actions"
          icon={Activity}
          loading={loading}
        />
        <StatTile label="Acteurs distincts" value={stats.actors} icon={Fingerprint} loading={loading} />
        <StatTile
          label="Événements sensibles"
          value={stats.security}
          hint="Échecs de connexion, rôles, suppressions"
          hintTone={stats.security > 0 ? 'warning' : 'success'}
          icon={ShieldCheck}
          loading={loading}
        />
      </div>

      <Card>
        <Toolbar>
          <SearchInput
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer par acteur, entité, IP, détails..."
            className="w-full sm:w-80"
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-lias-border rounded-lg px-3 py-2 text-[13px] outline-none bg-lias-surface
              cursor-pointer hover:border-lias-border-strong focus:border-lias-blue transition-colors duration-150"
          >
            <option value="">Toutes les actions</option>
            {availableActions.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABEL_FR[a] ?? a}
              </option>
            ))}
          </select>
          <div className="sm:ml-auto flex items-center gap-2 text-[12px] text-lias-muted">
            <Lock size={12} />
            {loading ? '—' : `${filtered.length} entrée(s) — lecture seule`}
          </div>
        </Toolbar>

        {loading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="Aucune entrée d'audit"
            description={
              filter || actionFilter
                ? 'Aucune action ne correspond à ces critères de filtrage.'
                : "Le journal est vide : aucune action tracée pour le moment."
            }
          />
        ) : (
          <Table minWidth="min-w-[960px]">
            <THead
              columns={['Horodatage', 'Acteur', 'Action', 'Entité', 'Détails', 'Origine']}
            />
            <TBody>
              {filtered.map((l) => (
                <TR key={l.id}>
                  <TD className="text-lias-muted font-mono text-[12px] whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleDateString('fr-FR')}
                    <span className="block text-[11px] text-lias-faint">
                      {new Date(l.createdAt).toLocaleTimeString('fr-FR')}
                    </span>
                  </TD>
                  <TD>
                    <span className="text-[12.5px] text-lias-ink">{l.actorEmail || 'système'}</span>
                  </TD>
                  <TD>
                    <Badge tone={ACTION_TONE[l.action] ?? 'neutral'} size="sm">
                      {ACTION_LABEL_FR[l.action] || l.action}
                    </Badge>
                  </TD>
                  <TD className="text-lias-muted font-mono text-[12px] whitespace-nowrap">
                    {l.entityType}
                    {l.entityId ? (
                      <span className="text-lias-faint"> #{String(l.entityId).slice(0, 8)}</span>
                    ) : null}
                  </TD>
                  <TD className="text-[12.5px] max-w-md">
                    <span className="block truncate" title={l.details}>
                      {l.details || '—'}
                    </span>
                  </TD>
                  <TD className="text-lias-faint font-mono text-[11.5px] whitespace-nowrap">
                    {l.ipAddress || '—'}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
