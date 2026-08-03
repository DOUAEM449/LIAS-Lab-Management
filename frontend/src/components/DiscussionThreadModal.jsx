import { useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import Modal from './Modal';
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

  return (
    <Modal open={Boolean(discussion)} onClose={onClose} title={discussion.title} subtitle="Discussion globale">
      <div className="h-80 overflow-y-auto flex flex-col gap-3 mb-3 pr-1">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-lias-muted gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-lias-muted">
            Aucun message. Soyez le premier à écrire.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="bg-lias-bg rounded-lg px-3 py-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-lias-ink">{m.senderName}</span>
                <span className="text-lias-muted">{new Date(m.timestamp).toLocaleString('fr-FR')}</span>
              </div>
              <div className="text-sm text-lias-ink">{m.content}</div>
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
          className="flex-1 px-3 py-2.5 border border-lias-border rounded-lg text-sm outline-none focus:border-lias-blue"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="bg-lias-blue text-white border-none rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>
    </Modal>
  );
}
