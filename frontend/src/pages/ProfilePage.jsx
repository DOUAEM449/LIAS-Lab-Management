import { useEffect, useRef, useState } from 'react';
import { KeyRound, UserCircle, Camera, Trash2, BookOpen, ShieldCheck, Info } from 'lucide-react';
import { TextField, TextAreaField, FieldRow } from '../components/FormField';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  CardHeader,
  Button,
  Badge,
  StatusBadge,
  MandateBadge,
  Alert,
  EmptyState,
  LoadingBlock,
  Spinner,
  Field,
} from '../components/ui';
import { getMyProfile, updateMember, uploadMyAvatar, deleteMyAvatar } from '../services/memberService';
import { getMemberMandates } from '../services/governanceService';
import { changePassword } from '../services/authService';
import { searchPublications } from '../services/publicationService';
import { ROLE_LABEL_FR } from '../utils/roles';

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function ProfilePage({ user, onAvatarUpdated }) {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [noMemberProfile, setNoMemberProfile] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToasts();

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const [mandates, setMandates] = useState([]);
  const [myPublications, setMyPublications] = useState([]);
  const [pubLoading, setPubLoading] = useState(false);

  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState(null);

  useEffect(() => {
    setProfileLoading(true);
    getMyProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          firstName: p.firstName ?? '',
          lastName: p.lastName ?? '',
          email: p.email ?? '',
          photoUrl: p.photoUrl ?? '',
          birthDate: p.birthDate ?? '',
          homeInstitution: p.homeInstitution ?? '',
          homeLaboratory: p.homeLaboratory ?? '',
          biography: p.biography ?? '',
          researchInterests: p.researchInterests ?? '',
        });

        getMemberMandates(p.id)
          .then(setMandates)
          .catch(() => setMandates([]));

        setPubLoading(true);
        searchPublications({ authorId: p.id, page: 0, size: 100, sort: 'year,desc' })
          .then((res) => setMyPublications(res.content))
          .catch(() => setMyPublications([]))
          .finally(() => setPubLoading(false));
      })
      .catch((err) => {
        if (err.response?.status === 404) setNoMemberProfile(true);
        else toast.error(friendlyError(err, 'Échec du chargement du profil'));
      })
      .finally(() => setProfileLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMember(profile.id, form);
      setProfile(updated);
      toast.success('Profil mis à jour.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la mise à jour du profil'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('La photo doit être au format JPEG, PNG ou WEBP.');
      e.target.value = '';
      return;
    }
    setAvatarUploading(true);
    try {
      const updated = await uploadMyAvatar(file);
      setProfile(updated);
      setForm((f) => ({ ...f, photoUrl: updated.photoUrl }));
      toast.success('Photo de profil mise à jour.');
      onAvatarUpdated?.(updated.photoUrl);
    } catch (err) {
      toast.error(friendlyError(err, 'Échec du téléversement de la photo'));
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  }

  async function handleDeleteAvatar() {
    setAvatarDeleting(true);
    try {
      const updated = await deleteMyAvatar();
      setProfile(updated);
      setForm((f) => ({ ...f, photoUrl: '' }));
      toast.success('Photo de profil supprimée.');
      onAvatarUpdated?.(null);
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la suppression de la photo'));
    } finally {
      setAvatarDeleting(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwdError(null);
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      setPwdError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setPwdSaving(true);
    try {
      await changePassword(pwdForm.currentPassword, pwdForm.newPassword);
      toast.success('Mot de passe modifié avec succès.');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwdError(friendlyError(err, 'Échec du changement de mot de passe'));
    } finally {
      setPwdSaving(false);
    }
  }

  const initials = `${form?.firstName?.[0] ?? ''}${form?.lastName?.[0] ?? ''}`.toUpperCase() || '--';
  const activeMandates = mandates.filter((m) => m.active && !m.endDate);

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <PageHeader
        eyebrow="Espace personnel"
        title="Mon profil"
        description="Vos informations de membre, votre position dans le laboratoire et vos paramètres de sécurité."
      />

      {/* ------------------------- Profile header ------------------------- */}
      {!profileLoading && !noMemberProfile && profile && (
        <Card className="mb-5 p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full bg-lias-navy flex items-center justify-center text-white font-semibold text-[26px] overflow-hidden">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                aria-label="Changer la photo de profil"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-lias-blue text-white border-2
                  border-lias-surface flex items-center justify-center cursor-pointer disabled:opacity-60
                  hover:bg-lias-blue-hover transition-colors duration-150"
              >
                {avatarUploading ? <Spinner size={14} /> : <Camera size={14} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="m-0 text-[20px] font-bold text-lias-navy tracking-[-0.01em]">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="m-0 mt-1 text-[13px] text-lias-muted">{profile.email}</p>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-lias-faint">Statut</span>
                <StatusBadge status={profile.currentStatus} size="sm" />
                <span className="w-px h-4 bg-lias-border mx-1" />
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-lias-faint">Rôle</span>
                <Badge tone="outline" size="sm">
                  {ROLE_LABEL_FR[user?.role] ?? user?.role}
                </Badge>
                {activeMandates.length > 0 && (
                  <>
                    <span className="w-px h-4 bg-lias-border mx-1" />
                    <span className="text-[10.5px] font-semibold uppercase tracking-wide text-lias-faint">
                      Mandat
                    </span>
                    {activeMandates.map((m) => (
                      <MandateBadge key={m.id} role={m.role} size="sm" />
                    ))}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-6 pt-5 border-t border-lias-border-light">
                <Field label="Équipe actuelle">{profile.currentTeamName || 'Non assignée'}</Field>
                <Field label="Établissement">{profile.homeInstitution}</Field>
                <Field label="Publications">{myPublications.length}</Field>
                <Field label="Affilié depuis">
                  {profile.firstAffiliationDate
                    ? new Date(profile.firstAffiliationDate).toLocaleDateString('fr-FR')
                    : null}
                </Field>
              </div>

              {form.photoUrl && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={avatarDeleting}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-lias-danger-text bg-transparent
                    border-none cursor-pointer p-0 mt-4 disabled:opacity-60"
                >
                  {avatarDeleting ? <Spinner size={12} /> : <Trash2 size={12} />}
                  Supprimer la photo
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5">
        {/* --------------------- Personal information --------------------- */}
        <Card>
          <CardHeader
            icon={UserCircle}
            title="Informations personnelles"
            description="Vous êtes le seul à pouvoir modifier votre profil, avec la direction."
          />

          {profileLoading ? (
            <LoadingBlock label="Chargement du profil..." />
          ) : noMemberProfile ? (
            <EmptyState
              icon={ShieldCheck}
              title="Compte technique"
              description="Ce compte est un compte d'administration système, sans profil de membre scientifique associé. Seul le changement de mot de passe est disponible."
            />
          ) : (
            <form onSubmit={handleSaveProfile} className="p-5.5">
              <FieldRow>
                <TextField
                  label="Prénom"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
                <TextField
                  label="Nom"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <TextField
                  label="Date de naissance"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  hint="Confidentielle — visible uniquement par vous et la direction."
                />
                <TextField
                  label="Établissement d'origine"
                  value={form.homeInstitution}
                  onChange={(e) => setForm({ ...form, homeInstitution: e.target.value })}
                />
                <TextField
                  label="Laboratoire d'origine"
                  value={form.homeLaboratory}
                  onChange={(e) => setForm({ ...form, homeLaboratory: e.target.value })}
                />
              </FieldRow>

              <TextAreaField
                label="Biographie"
                rows={4}
                value={form.biography}
                onChange={(e) => setForm({ ...form, biography: e.target.value })}
                placeholder="Parcours, thématiques de recherche, distinctions..."
              />
              <TextAreaField
                label="Centres d'intérêt scientifiques"
                rows={2}
                value={form.researchInterests}
                onChange={(e) => setForm({ ...form, researchInterests: e.target.value })}
                placeholder="Mots-clés séparés par des virgules"
              />

              <Button type="submit" className="w-full" loading={saving}>
                Enregistrer mon profil
              </Button>
            </form>
          )}
        </Card>

        {/* ------------------------- Security ------------------------- */}
        <Card className="h-fit">
          <CardHeader icon={KeyRound} title="Sécurité" description="Modifier votre mot de passe d'accès." />
          <form onSubmit={handleChangePassword} className="p-5.5">
            {user?.mustChangePassword && (
              <Alert tone="warning" className="mb-4">
                Un changement de mot de passe est requis pour ce compte.
              </Alert>
            )}
            {pwdError && (
              <Alert tone="danger" className="mb-4">
                {pwdError}
              </Alert>
            )}

            <TextField
              label="Mot de passe actuel"
              type="password"
              autoComplete="current-password"
              required
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
            />
            <TextField
              label="Nouveau mot de passe"
              type="password"
              autoComplete="new-password"
              required
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              hint="8 caractères minimum."
            />
            <TextField
              label="Confirmer le nouveau mot de passe"
              type="password"
              autoComplete="new-password"
              required
              value={pwdForm.confirmPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
            />
            <Button type="submit" variant="secondary" className="w-full" loading={pwdSaving}>
              Modifier le mot de passe
            </Button>
          </form>
        </Card>
      </div>

      {/* ------------------------- Publications ------------------------- */}
      {!profileLoading && !noMemberProfile && (
        <Card className="mt-5">
          <CardHeader
            icon={BookOpen}
            title="Mes publications"
            description="Travaux dont vous êtes co-auteur, tous exercices confondus."
          />
          {pubLoading ? (
            <LoadingBlock label="Chargement des publications..." />
          ) : myPublications.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Aucune publication"
              description="Aucune publication ne vous est encore associée. Ajoutez-en une depuis l'espace Publications."
            />
          ) : (
            <ul className="list-none p-0 m-0">
              {myPublications.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start justify-between gap-4 px-5.5 py-3.5 border-b border-lias-border-light last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium text-lias-ink leading-snug">{p.title}</div>
                    <div className="text-[12px] text-lias-muted mt-1">
                      {p.authors?.map((a) => a.fullName).join(', ')}
                    </div>
                  </div>
                  <span className="text-[12.5px] font-mono font-semibold text-lias-blue-dark shrink-0">
                    {p.year}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {!profileLoading && !noMemberProfile && (
        <div className="mt-4 flex items-start gap-2 text-[12px] text-lias-muted">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>
            Votre statut, votre équipe et vos mandats sont gérés par la direction du laboratoire : ils ne
            sont pas modifiables depuis votre profil, et chaque changement est historisé.
          </span>
        </div>
      )}
    </div>
  );
}
