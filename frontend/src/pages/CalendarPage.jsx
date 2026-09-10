import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Presentation,
  ClipboardCheck,
  CalendarClock,
} from 'lucide-react';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  CardHeader,
  Button,
  Badge,
  Alert,
  EmptyState,
  Skeleton,
  Tabs,
} from '../components/ui';
import { listCalendarItems } from '../services/calendarService';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const ITEM_STYLE = {
  EVENT: {
    label: 'Événement scientifique',
    icon: Presentation,
    chip: 'bg-lias-blue-tint-solid text-lias-blue-dark',
    dot: 'bg-lias-blue',
    tone: 'info',
  },
  MEETING: {
    label: 'Réunion interne',
    icon: ClipboardCheck,
    chip: 'bg-lias-mandate-bg text-lias-mandate-text',
    dot: 'bg-lias-mandate',
    tone: 'mandate',
  },
};

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
}
function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}
/** Monday-first index (0 = Monday ... 6 = Sunday), matching the French convention. */
function mondayIndex(date) {
  return (date.getDay() + 6) % 7;
}

/**
 * CdC §2.20 — Calendrier.
 * Unified view of scientific events and internal meetings, with month-by-month
 * temporal navigation. Data comes from /api/v1/calendar, which already merges
 * both sources server-side — nothing is fabricated client-side.
 */
export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [view, setView] = useState('month');

  const toast = useToasts();
  const today = useMemo(() => new Date(), []);

  const loadItems = useCallback(() => {
    setLoading(true);
    setError(null);
    // Fetch a little beyond the month so the leading/trailing days of the grid
    // (which belong to the neighbouring months) also show their items.
    const from = new Date(startOfMonth(cursor));
    from.setDate(from.getDate() - 7);
    const to = new Date(endOfMonth(cursor));
    to.setDate(to.getDate() + 7);

    listCalendarItems(from, to)
      .then(setItems)
      .catch((err) =>
        setError(err.response?.data?.message || 'Échec du chargement du calendrier')
      )
      .finally(() => setLoading(false));
  }, [cursor]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Six-week grid starting on the Monday of the week containing the 1st.
  const grid = useMemo(() => {
    const first = startOfMonth(cursor);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - mondayIndex(first));

    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + i);
      return day;
    });
  }, [cursor]);

  const itemsByDay = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const start = new Date(item.startDate);
      const end = item.endDate ? new Date(item.endDate) : start;
      // A multi-day event appears on every day it spans.
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      while (day <= last) {
        const key = day.toDateString();
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
        day.setDate(day.getDate() + 1);
      }
    });
    return map;
  }, [items]);

  const monthItems = useMemo(
    () =>
      items
        .filter((i) => {
          const d = new Date(i.startDate);
          return d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear();
        })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate)),
    [items, cursor]
  );

  const selectedItems = selectedDay ? itemsByDay.get(selectedDay.toDateString()) ?? [] : [];

  function shiftMonth(delta) {
    setSelectedDay(null);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  const eventCount = monthItems.filter((i) => i.type === 'EVENT').length;
  const meetingCount = monthItems.filter((i) => i.type === 'MEETING').length;

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <PageHeader
        eyebrow="Vie du laboratoire"
        title="Calendrier"
        description="Vue unifiée des événements scientifiques (conférences, séminaires, workshops) et des réunions internes du laboratoire, avec navigation temporelle mois par mois."
        actions={
          <>
            <Tabs
              tabs={[
                { key: 'month', label: 'Mois' },
                { key: 'agenda', label: 'Agenda' },
              ]}
              active={view}
              onChange={setView}
            />
            <Button
              variant="secondary"
              onClick={() => {
                setCursor(startOfMonth(new Date()));
                setSelectedDay(null);
              }}
            >
              Aujourd'hui
            </Button>
          </>
        }
      />

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      <Card className="mb-5">
        <div className="flex items-center justify-between gap-4 px-5.5 py-4 border-b border-lias-border-light">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => shiftMonth(-1)}
              aria-label="Mois précédent"
              icon={ChevronLeft}
            />
            <h2 className="m-0 text-[16px] font-semibold text-lias-navy min-w-[170px] text-center">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => shiftMonth(1)}
              aria-label="Mois suivant"
              icon={ChevronRight}
            />
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[12px] text-lias-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lias-blue" />
              {eventCount} événement(s)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lias-mandate" />
              {meetingCount} réunion(s)
            </span>
          </div>
        </div>

        {view === 'month' ? (
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-[11px] font-semibold uppercase tracking-[0.06em] text-lias-faint text-center py-2"
                >
                  {d}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 42 }).map((_, i) => (
                  <Skeleton key={i} className="h-[92px] rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {grid.map((day) => {
                  const dayItems = itemsByDay.get(day.toDateString()) ?? [];
                  const inMonth = day.getMonth() === cursor.getMonth();
                  const isToday = isSameDay(day, today);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(dayItems.length ? day : null)}
                      className={`min-h-[92px] rounded-lg border p-1.5 text-left align-top transition-colors duration-150
                        ${dayItems.length ? 'cursor-pointer' : 'cursor-default'}
                        ${
                          isSelected
                            ? 'border-lias-blue bg-lias-blue-tint-solid'
                            : inMonth
                              ? 'border-lias-border-light bg-lias-surface hover:border-lias-border-strong'
                              : 'border-transparent bg-lias-surface-muted/50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[12px] font-semibold w-6 h-6 rounded-full flex items-center justify-center
                            ${
                              isToday
                                ? 'bg-lias-navy text-white'
                                : inMonth
                                  ? 'text-lias-ink'
                                  : 'text-lias-faint'
                            }`}
                        >
                          {day.getDate()}
                        </span>
                        {dayItems.length > 2 && (
                          <span className="text-[10px] font-semibold text-lias-muted">
                            +{dayItems.length - 2}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        {dayItems.slice(0, 2).map((item) => {
                          const style = ITEM_STYLE[item.type] ?? ITEM_STYLE.EVENT;
                          return (
                            <span
                              key={`${item.id}-${day.getDate()}`}
                              className={`block text-[10.5px] font-medium leading-tight rounded px-1.5 py-1 truncate ${style.chip}`}
                              title={item.title}
                            >
                              {item.title}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <AgendaView items={monthItems} loading={loading} />
        )}
      </Card>

      {selectedDay && (
        <Card className="lias-enter">
          <CardHeader
            icon={CalendarClock}
            title={selectedDay.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            description={`${selectedItems.length} élément(s) au programme`}
            actions={
              <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>
                Fermer
              </Button>
            }
          />
          <ul className="list-none p-0 m-0">
            {selectedItems.map((item) => (
              <CalendarItemRow key={item.id} item={item} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function AgendaView({ items, loading }) {
  if (loading) {
    return (
      <div className="p-5.5 flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Aucun élément ce mois-ci"
        description="Aucun événement scientifique ni réunion interne n'est programmé sur cette période."
      />
    );
  }
  return (
    <ul className="list-none p-0 m-0">
      {items.map((item) => (
        <CalendarItemRow key={item.id} item={item} showDate />
      ))}
    </ul>
  );
}

function CalendarItemRow({ item, showDate = false }) {
  const style = ITEM_STYLE[item.type] ?? ITEM_STYLE.EVENT;
  const Icon = style.icon;
  const start = new Date(item.startDate);
  const end = item.endDate ? new Date(item.endDate) : null;
  const multiDay = end && !isSameDay(start, end);

  return (
    <li className="flex items-start gap-3.5 px-5.5 py-4 border-b border-lias-border-light last:border-b-0">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.chip}`}
        aria-hidden="true"
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-semibold text-lias-ink">{item.title}</span>
          <Badge tone={style.tone} size="sm">
            {style.label}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[12.5px] text-lias-muted">
          <span className="font-mono">
            {showDate && `${start.toLocaleDateString('fr-FR')} — `}
            {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {multiDay && ` → ${end.toLocaleDateString('fr-FR')}`}
          </span>
          {item.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} />
              {item.location}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
