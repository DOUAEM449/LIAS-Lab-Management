import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, KeyRound, UserCircle } from 'lucide-react';
import { TextField, TextAreaField } from '../components/FormField';
import { ToastStack, useToasts } from '../components/Toast';
import { getMyProfile, updateMember } from '../services/memberService';
import { changePassword } from '../services/authService';
import { ROLE_LABEL_FR } from '../utils/roles';

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function ProfilePage({ user }) {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [noMemberProfile, setNoMemberProfile] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToasts();

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
          biography: p.biography ?? '',
          researchInterests: p.researchInterests ?? '',
        });
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setNoMemberProfile(true);
        } else {
          toast.error(friendlyError(err, 'Échec du chargement du profil'));
        }
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

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <div className="mb-6">
        <h1 className="m-0 text-[22px] font-bold text-lias-navy">Mon Profil</h1>
        <p className="mt-1.5 mb-0 text-[13.5px] text-lias-muted">
          {user?.email} — {ROLE_LABEL_FR[user?.role] ?? user?.role}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-lias-border rounded-xl p-5.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-lias-navy mb-4">
            <UserCircle size={16} />
            Informations personnelles
          </div>

          {profileLoading ? (
            <div className="flex items-center gap-2 text-lias-muted py-8 justify-center">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Chargement...</span>
            </div>
          ) : noMemberProfile ? (
            <div className="text-sm text-lias-muted py-4">
              Ce compte est un compte technique (administrateur système) sans profil de
              membre associé. Seul le changement de mot de passe est disponible.
            </div>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <div className="grid grid-cols-2 gap-x-4">
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
              </div>
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <TextField
                label="Photo (URL)"
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                placeholder="https://..."
              />
              <TextAreaField
                label="Biographie"
                value={form.biography}
                onChange={(e) => setForm({ ...form, biography: e.target.value })}
              />
              <TextAreaField
                label="Centres d'intérêt / Recherche"
                value={form.researchInterests}
                onChange={(e) => setForm({ ...form, researchInterests: e.target.value })}
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-lias-blue text-white border-none rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                Enregistrer
              </button>
            </form>
          )}
        </div>

        <div className="bg-white border border-lias-border rounded-xl p-5.5 h-fit">
          <div className="flex items-center gap-2 text-sm font-semibold text-lias-navy mb-4">
            <KeyRound size={16} />
            Changer le mot de passe
          </div>

          {pwdError && (
            <div className="mb-4 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-3 py-2.5">
              <AlertCircle size={15} />
              {pwdError}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <TextField
              label="Mot de passe actuel"
              type="password"
              required
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
            />
            <TextField
              label="Nouveau mot de passe"
              type="password"
              required
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
            />
            <TextField
              label="Confirmer le nouveau mot de passe"
              type="password"
              required
              value={pwdForm.confirmPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
            />
            <button
              type="submit"
              disabled={pwdSaving}
              className="w-full bg-white border border-lias-border text-lias-ink rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {pwdSaving && <Loader2 size={15} className="animate-spin" />}
              Modifier le mot de passe
            </button>
          </form>

          {user?.mustChangePassword && (
            <div className="mt-4 flex items-center gap-2 bg-lias-warning-bg text-lias-warning-text text-xs rounded-lg px-3 py-2.5">
              <CheckCircle2 size={14} />
              Un changement de mot de passe est requis pour ce compte.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
