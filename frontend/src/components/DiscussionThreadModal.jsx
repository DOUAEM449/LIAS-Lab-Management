import { useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import Modal from './Modal';
import Button from './ui/Button';
import { listMessages, postMessage } from '../services/discussionService';

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function DiscussionThreadModal({ discussion, onClose, toast }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!discussion) return;
    setLoading(true);
    listMessages(discussion.id)
      .then(setMessages)
      .catch((err) => toast.error(friendlyError(err, 'Échec du chargement des messages')))
      .finally(() => setLoading(false));
  }, [discussion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!discussion) return null;

  async function handleSend(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      const msg = await postMessage(discussion.id, content.trim());
      setMessages((prev) => [...prev, msg]);
      setContent('');
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'envoi du message"));
    } finally {
      setSending(false);
    }
  }

  const scopeLabel =
    {
      GLOBAL: 'Discussion générale du laboratoire',
      TEAM: `Discussion d'équipe${discussion.teamName ? ` — ${discussion.teamName}` : ''}`,
      EVENT: `Discussion d'événement${discussion.eventTitle ? ` — ${discussion.eventTitle}` : ''}`,
    }[discussion.scope] ?? 'Discussion';

  return (
    <Modal open={Boolean(discussion)} onClose={onClose} title={discussion.title} subtitle={scopeLabel}>
      <div className="h-80 overflow-y-auto flex flex-col gap-2.5 mb-4 pr-1">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-lias-muted gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[13px]">Chargement...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[13px] text-lias-muted text-center px-6">
            Aucun message dans cette discussion. Soyez le premier à écrire.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="bg-lias-surface-muted border border-lias-border-light rounded-lg px-3.5 py-2.5">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-[12.5px] font-semibold text-lias-ink">{m.senderName}</span>
                <span className="text-[11px] text-lias-faint font-mono shrink-0">
                  {new Date(m.timestamp).toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="text-[13px] text-lias-ink leading-relaxed whitespace-pre-wrap">{m.content}</div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 px-3 py-2.5 border border-lias-border rounded-lg text-[13.5px] outline-none
            bg-lias-surface hover:border-lias-border-strong focus:border-lias-blue transition-colors duration-150"
        />
        <Button type="submit" icon={Send} loading={sending} disabled={!content.trim()} aria-label="Envoyer" />
      </form>
    </Modal>
  );
}
