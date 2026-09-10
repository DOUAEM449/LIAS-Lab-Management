import { useEffect, useState } from 'react';
import { Users, Presentation } from 'lucide-react';
import Modal from './Modal';
import Badge from './ui/Badge';
import { Alert, EmptyState, LoadingBlock } from './ui/Feedback';
import { listEventParticipants } from '../services/eventService';

/** Registered participants and designated organizers of one event (CdC §2.9). */
export default function EventParticipantsModal({ event, onClose }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!event) return;
    setLoading(true);
    setError(null);
    listEventParticipants(event.id)
      .then(setParticipants)
      .catch((err) =>
        setError(err.response?.data?.message || 'Échec du chargement des participants')
      )
      .finally(() => setLoading(false));
  }, [event]);

  return (
    <Modal
      open={Boolean(event)}
      onClose={onClose}
      title="Participants & organisateurs"
      subtitle={event?.title}
      maxWidth="max-w-lg"
    >
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {event?.organizers?.length > 0 && (
        <section className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-lias-faint mb-3 flex items-center gap-1.5">
            <Presentation size={12} />
            Organisateurs
          </div>
          <div className="flex flex-wrap gap-2">
            {event.organizers.map((o) => (
              <Badge key={o.memberId} tone="mandate">
                {o.fullName}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-lias-faint mb-3 flex items-center gap-1.5">
        <Users size={12} />
        Participants inscrits
      </div>

      {loading ? (
        <LoadingBlock label="Chargement des participants..." />
      ) : participants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun participant inscrit"
          description="Les membres peuvent s'inscrire depuis la liste des événements."
          className="py-10"
        />
      ) : (
        <ul className="list-none p-0 m-0">
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 py-3 border-b border-lias-border-light last:border-b-0"
            >
              <span className="text-[13px] text-lias-ink">{p.memberName}</span>
              <span className="text-[11.5px] text-lias-faint font-mono shrink-0">
                Inscrit le {new Date(p.registeredAt).toLocaleDateString('fr-FR')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
