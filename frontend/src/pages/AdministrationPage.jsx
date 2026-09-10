import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Ban,
  CheckCircle2,
  Building2,
  Users,
  KeyRound,
  Info,
  Power,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { TextField, TextAreaField, SelectField } from '../components/FormField';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  CardHeader,
  StatTile,
  Tabs,
  Button,
  Badge,
  Alert,
  EmptyState,
  TableSkeleton,
  LoadingBlock,
  Table,
  THead,
  TBody,
  TR,
  TD,
  TDActions,
} from '../components/ui';
import {
  listUsers,
  createUser,
  enableUser,
  disableUser,
  updateUserRole,
} from '../services/administrationService';
import { getLaboratory, updateLaboratory } from '../services/laboratoryService';
import { ROLE_LABEL_FR } from '../utils/roles';

const ROLE_OPTIONS = Object.keys(ROLE_LABEL_FR);

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

/**
 * CdC §2.5.1 — administration système.
 * Technical account management and laboratory settings. Deliberately separate
 * from Gouvernance: SYSTEM_ADMIN handles the technical layer, the Director
 * handles the scientific/administrative governance.
 */
export default function AdministrationPage() {
  const [tab, setTab] = useState('accounts');
  const toast = useToasts();

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [totalElements, setTotalElements] = useState(0);

  const [createForm, setCreateForm] = useState({ email: '', temporaryPassword: '', role: 'ASSOCIATE_MEMBER' });
  const [creating, setCreating] = useState(false);

  const [confirmDisable, setConfirmDisable] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [labForm, setLabForm] = useState(null);
  const [labLoading, setLabLoading] = useState(true);
  const [labSaving, setLabSaving] = useState(false);

  const loadUsers = useCallback(() => {
    setUsersLoading(true);
    setUsersError(null);
    listUsers({ page: 0, size: 100 })
      .then((res) => {
        setUsers(res.content);
        setTotalElements(res.totalElements);
      })
      .catch((err) => setUsersError(friendlyError(err, 'Échec du chargement des comptes')))
      .finally(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
    setLabLoading(true);
    getLaboratory()
      .then((l) =>
        setLabForm({
          name: l.name ?? '',
          foundingDate: l.foundingDate ?? '',
          description: l.description ?? '',
          directorMessage: l.directorMessage ?? '',
        })
      )
      .catch((err) => toast.error(friendlyError(err, 'Échec du chargement des informations du laboratoire')))
      .finally(() => setLabLoading(false));
  }, [loadUsers]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(
    () => ({
      disabled: users.filter((u) => !u.enabled).length,
      mustChange: users.filter((u) => u.mustChangePassword).length,
      failedAttempts: users.filter((u) => u.failedLoginAttempts > 0).length,
    }),
    [users]
  );

  async function handleCreateUser(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await createUser(createForm);
      toast.success('Compte technique créé.');
      setCreateForm({ email: '', temporaryPassword: '', role: 'ASSOCIATE_MEMBER' });
      loadUsers();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la création du compte'));
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleEnabled(user) {
    setBusyId(user.id);
    try {
      if (user.enabled) {
        await disableUser(user.id);
        toast.success('Compte désactivé.');
      } else {
        await enableUser(user.id);
        toast.success('Compte réactivé.');
      }
      setConfirmDisable(null);
      loadUsers();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la mise à jour du compte'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRoleChange(user, role) {
    if (role === user.role) return;
    setBusyId(user.id);
    try {
      await updateUserRole(user.id, role);
      toast.success('Rôle mis à jour — le changement est historisé.');
      loadUsers();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la mise à jour du rôle'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveLab(e) {
    e.preventDefault();
    setLabSaving(true);
    try {
      const updated = await updateLaboratory(labForm);
      setLabForm({
        name: updated.name ?? '',
        foundingDate: updated.foundingDate ?? '',
        description: updated.description ?? '',
        directorMessage: updated.directorMessage ?? '',
      });
      toast.success('Informations du laboratoire mises à jour.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la mise à jour'));
    } finally {
      setLabSaving(false);
    }
  }

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <PageHeader
        eyebrow="Administration technique"
        title="Administration système"
        description="Comptes d'accès, rôles techniques et identité institutionnelle du laboratoire. La gouvernance métier — mandats et adhésions — se gère depuis l'espace Gouvernance."
        actions={
          <Tabs
            tabs={[
              { key: 'accounts', label: 'Comptes', icon: Users },
              { key: 'laboratory', label: 'Laboratoire', icon: Building2 },
            ]}
            active={tab}
            onChange={setTab}
          />
        }
      />

      {tab === 'accounts' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatTile label="Comptes enregistrés" value={totalElements} icon={ShieldCheck} loading={usersLoading} />
            <StatTile
              label="Comptes désactivés"
              value={stats.disabled}
              hint={stats.disabled > 0 ? 'Accès bloqué' : 'Tous les comptes sont actifs'}
              hintTone={stats.disabled > 0 ? 'warning' : 'success'}
              icon={Ban}
              loading={usersLoading}
            />
            <StatTile
              label="Mot de passe à changer"
              value={stats.mustChange}
              hint="Comptes en première connexion"
              icon={KeyRound}
              loading={usersLoading}
            />
            <StatTile
              label="Échecs de connexion"
              value={stats.failedAttempts}
              hint={stats.failedAttempts > 0 ? 'Comptes concernés' : 'Aucun incident'}
              hintTone={stats.failedAttempts > 0 ? 'warning' : 'success'}
              icon={Power}
              loading={usersLoading}
            />
          </div>

          <Card className="mb-5" padded>
            <div className="flex items-center gap-2 text-[13.5px] font-semibold text-lias-navy mb-1.5">
              <Plus size={15} className="text-lias-blue-dark" />
              Créer un compte technique
            </div>
            <p className="text-[12.5px] text-lias-muted mt-0 mb-4 leading-relaxed">
              Pour les membres scientifiques, préférez la validation d'une demande d'adhésion : elle crée
              le compte <em>et</em> le profil de membre, avec sa première période d'affiliation. Ce
              formulaire crée un compte d'accès sans profil lié.
            </p>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 items-start">
              <TextField
                label="Email"
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="compte@lias.ma"
              />
              <TextField
                label="Mot de passe temporaire"
                required
                value={createForm.temporaryPassword}
                onChange={(e) => setCreateForm({ ...createForm, temporaryPassword: e.target.value })}
              />
              <SelectField
                label="Rôle technique"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL_FR[r]}
                  </option>
                ))}
              </SelectField>
              <Button type="submit" icon={Plus} loading={creating} className="mt-6">
                Créer le compte
              </Button>
            </form>
          </Card>

          {usersError && (
            <Alert tone="danger" className="mb-5">
              {usersError}
            </Alert>
          )}

          <Card>
            <CardHeader
              icon={Users}
              title="Comptes d'accès"
              description="Le rôle listé ici est le rôle effectif lu par la sécurité applicative."
            />
            {usersLoading ? (
              <TableSkeleton rows={6} columns={5} />
            ) : users.length === 0 ? (
              <EmptyState icon={Users} title="Aucun compte" description="Aucun compte d'accès enregistré." />
            ) : (
              <Table minWidth="min-w-[860px]">
                <THead
                  columns={[
                    'Compte',
                    'Rôle effectif',
                    'État',
                    'Dernière connexion',
                    { label: 'Actions', align: 'right' },
                  ]}
                />
                <TBody>
                  {users.map((u) => (
                    <TR key={u.id}>
                      <TD>
                        <div className="text-[13px] font-medium text-lias-ink">{u.email}</div>
                        {u.mustChangePassword && (
                          <Badge tone="warning" size="sm" className="mt-1">
                            Mot de passe à changer
                          </Badge>
                        )}
                      </TD>
                      <TD>
                        <select
                          value={u.role}
                          disabled={busyId === u.id}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className="text-[12.5px] border border-lias-border rounded-md px-2.5 py-1.5 bg-lias-surface
                            text-lias-ink cursor-pointer hover:border-lias-border-strong focus:border-lias-blue
                            outline-none transition-colors duration-150 disabled:opacity-50"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL_FR[r]}
                            </option>
                          ))}
                        </select>
                      </TD>
                      <TD>
                        <Badge
                          tone={u.enabled ? 'success' : 'danger'}
                          icon={u.enabled ? CheckCircle2 : Ban}
                          size="sm"
                        >
                          {u.enabled ? 'Actif' : 'Désactivé'}
                        </Badge>
                        {u.failedLoginAttempts > 0 && (
                          <span className="block text-[11px] text-lias-warning-text mt-1">
                            {u.failedLoginAttempts} échec(s)
                          </span>
                        )}
                      </TD>
                      <TD className="text-lias-muted font-mono text-[12px]">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('fr-FR') : 'Jamais connecté'}
                      </TD>
                      <TDActions>
                        <Button
                          size="sm"
                          variant={u.enabled ? 'danger' : 'secondary'}
                          icon={u.enabled ? Ban : CheckCircle2}
                          loading={busyId === u.id}
                          onClick={() => (u.enabled ? setConfirmDisable(u) : handleToggleEnabled(u))}
                        >
                          {u.enabled ? 'Désactiver' : 'Activer'}
                        </Button>
                      </TDActions>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          <div className="mt-4 flex items-start gap-2 text-[12px] text-lias-muted">
            <Info size={13} className="mt-0.5 shrink-0" />
            <span>
              Modifier un rôle ici constitue une dérogation administrative : elle est historisée au même titre
              qu'un changement issu d'un mandat ou d'un statut. Le rôle d'un membre est normalement dérivé
              automatiquement de son statut et de ses mandats.
            </span>
          </div>
        </>
      )}

      {tab === 'laboratory' && (
        <Card className="max-w-3xl">
          <CardHeader
            icon={Building2}
            title="Identité du laboratoire"
            description="Ces informations alimentent directement le portail public du LIAS."
          />
          {labLoading || !labForm ? (
            <LoadingBlock label="Chargement des informations..." />
          ) : (
            <form onSubmit={handleSaveLab} className="p-5.5">
              <TextField
                label="Nom officiel du laboratoire"
                required
                value={labForm.name}
                onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
              />
              <TextField
                label="Date de création"
                type="date"
                value={labForm.foundingDate}
                onChange={(e) => setLabForm({ ...labForm, foundingDate: e.target.value })}
                hint="Affichée sur la page d'accueil publique (CdC §2.4.1)."
              />
              <TextAreaField
                label="Présentation du laboratoire"
                rows={4}
                value={labForm.description}
                onChange={(e) => setLabForm({ ...labForm, description: e.target.value })}
                placeholder="Mission, positionnement scientifique, domaines d'excellence..."
              />
              <TextAreaField
                label="Mot du directeur"
                rows={6}
                value={labForm.directorMessage}
                onChange={(e) => setLabForm({ ...labForm, directorMessage: e.target.value })}
                placeholder="Message d'accueil affiché sur le site public."
                hint="Le nom du directeur affiché est celui du mandat actif : il n'est pas saisi ici."
              />
              <Button type="submit" className="w-full" loading={labSaving}>
                Enregistrer les informations
              </Button>
            </form>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(confirmDisable)}
        title="Désactiver ce compte"
        message={`Le compte « ${confirmDisable?.email} » ne pourra plus se connecter. Son historique est conservé et le compte peut être réactivé à tout moment.`}
        confirmLabel="Désactiver"
        loading={busyId === confirmDisable?.id}
        onConfirm={() => handleToggleEnabled(confirmDisable)}
        onCancel={() => setConfirmDisable(null)}
      />
    </div>
  );
}
