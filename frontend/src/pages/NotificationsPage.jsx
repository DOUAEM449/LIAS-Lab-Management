import { useCallback, useEffect, useState } from 'react';
import { Bell, MessageSquare, CheckCheck, Plus, AlertCircle, Loader2 } from 'lucide-react';
import DiscussionThreadModal from '../components/DiscussionThreadModal';
import { TextField } from '../components/FormField';
import { ToastStack, useToasts } from '../components/Toast';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';
import { listDiscussions, createDiscussion } from '../services/discussionService';

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function NotificationsPage() {
  const [tab, setTab] = useState('notifications');
  const toast = useToasts();

  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const [discussions, setDiscussions] = useState([]);
  const [discLoading, setDiscLoading] = useState(true);
  const [discError, setDiscError] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [openDiscussion, setOpenDiscussion] = useState(null);

  const loadNotifications = useCallback(() => {
    setNotifLoading(true);
    setNotifError(null);
    listNotifications()
      .then((res) => setNotifications(res.content))
      .catch((err) => setNotifError(friendlyError(err, 'Échec du chargement des notifications')))
      .finally(() => setNotifLoading(false));
  }, []);

  const loadDiscussions = useCallback(() => {
    setDiscLoading(true);
    setDiscError(null);
    listDiscussions('GLOBAL')
      .then((res) => setDiscussions(res.content))
      .catch((err) => setDiscError(friendlyError(err, 'Échec du chargement des discussions')))
      .finally(() => setDiscLoading(false));
  }, []);

  useEffect(() => {
    loadNotifications();
    loadDiscussions();
  }, [loadNotifications, loadDiscussions]);

  async function handleMarkRead(n) {
    if (n.read) return;
    try {
      await markNotificationRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    } catch (err) {
      toast.error(friendlyError(err, 'Échec'));
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Toutes les notifications marquées comme lues.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec'));
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleCreateDiscussion(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createDiscussion({ title: newTitle.trim(), scope: 'GLOBAL' });
      setNewTitle('');
      toast.success('Discussion créée.');
      loadDiscussions();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la création de la discussion'));
    } finally {
      setCreating(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <div className="mb-6">
        <h1 className="m-0 text-[22px] font-bold text-lias-navy">Notifications & Communication</h1>
        <p className="mt-1.5 mb-0 text-[13.5px] text-lias-muted">
          Centre de notifications et discussions internes du laboratoire.
        </p>
      </div>

      <div className="flex items-center gap-1.5 bg-lias-bg rounded-lg p-1 w-fit mb-5">
        {[
          { key: 'notifications', label: `Notifications${unreadCount ? ` (${unreadCount})` : ''}` },
          { key: 'discussions', label: 'Discussions' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-[12.5px] font-medium cursor-pointer border-none transition-colors ${
              tab === t.key ? 'bg-white text-lias-navy shadow-sm' : 'bg-transparent text-lias-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'notifications' && (
        <div className="bg-white border border-lias-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5.5 py-4 border-b border-lias-border-light">
            <div className="flex items-center gap-2 text-sm font-semibold text-lias-navy">
              <Bell size={16} />
              Mes notifications
            </div>
            <button
              onClick={handleMarkAll}
              disabled={markingAll || unreadCount === 0}
              className="flex items-center gap-1.5 text-xs text-lias-blue-dark bg-transparent border-none cursor-pointer disabled:opacity-40"
            >
              {markingAll ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
              Tout marquer comme lu
            </button>
          </div>

          {notifError && (
            <div className="flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm px-5.5 py-2.5">
              <AlertCircle size={15} />
              {notifError}
            </div>
          )}

          {notifLoading ? (
            <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Chargement...</div>
          ) : notifications.length === 0 ? (
            <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Aucune notification.</div>
          ) : (
            <ul className="list-none p-0 m-0">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleMarkRead(n)}
                  className={`flex items-start gap-3 px-5.5 py-3.5 border-t border-lias-border-light cursor-pointer ${
                    n.read ? '' : 'bg-lias-blue-tint/30'
                  }`}
                >
                  {!n.read && <span className="w-2 h-2 rounded-full bg-lias-blue mt-1.5 shrink-0" />}
                  <div className={n.read ? 'ml-5' : ''}>
                    <div className="text-[13px] text-lias-ink">{n.message}</div>
                    <div className="text-[11.5px] text-lias-muted mt-0.5">
                      {new Date(n.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'discussions' && (
        <>
          <div className="bg-white border border-lias-border rounded-xl p-5.5 mb-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-lias-navy mb-3">
              <MessageSquare size={16} />
              Nouvelle discussion (globale)
            </div>
            <form onSubmit={handleCreateDiscussion} className="flex items-end gap-3">
              <div className="flex-1">
                <TextField label="Titre" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                className="bg-lias-blue text-white border-none rounded-lg py-2.5 px-4 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center gap-2 mb-3.5"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Créer
              </button>
            </form>
          </div>

          {discError && (
            <div className="mb-5 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-4 py-3">
              <AlertCircle size={16} />
              {discError}
            </div>
          )}

          <div className="bg-white border border-lias-border rounded-xl overflow-hidden">
            {discLoading ? (
              <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Chargement...</div>
            ) : discussions.length === 0 ? (
              <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Aucune discussion.</div>
            ) : (
              <ul className="list-none p-0 m-0">
                {discussions.map((d) => (
                  <li
                    key={d.id}
                    onClick={() => setOpenDiscussion(d)}
                    className="flex items-center justify-between px-5.5 py-3.5 border-t border-lias-border-light cursor-pointer hover:bg-lias-bg/60"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-lias-ink">{d.title}</div>
                      <div className="text-[12px] text-lias-muted">
                        Par {d.createdByName} — {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <DiscussionThreadModal
        discussion={openDiscussion}
        onClose={() => setOpenDiscussion(null)}
        toast={toast}
      />
    </div>
  );
}
