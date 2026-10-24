import { formatFullDate } from "@/lib/format";
import { eventTypeLabels, fill, strings } from "@/lib/strings";
import type { HistoricalEvent } from "@/lib/types";

export function EventsList({ events }: { events: readonly HistoricalEvent[] }) {
  if (events.length === 0) return null;

  return (
    <section className="panel mt-4" aria-labelledby="events-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule px-4 py-3 lg:px-6">
        <h2 id="events-title" className="font-serif text-lg font-semibold">
          {strings.events.title}
        </h2>
        <p className="text-[11px] leading-4 text-muted">
          {fill(strings.events.count, { count: events.length })}
        </p>
      </div>
      <p className="px-4 pt-2 text-[11px] leading-4 text-muted lg:px-6">
        {strings.events.description}
      </p>
      <ol className="divide-y divide-rule">
        {events.map((event) => (
          <li key={event.id} className="px-4 py-3 lg:px-6">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <time
                dateTime={event.date}
                className="text-[11px] font-medium text-ink tnum"
              >
                {formatFullDate(event.date)}
              </time>
              <span className="badge">
                {eventTypeLabels[event.type] ?? event.type}
              </span>
            </div>
            <h3 className="mt-1 text-[14px] font-semibold text-ink">
              {event.title}
            </h3>
            <p className="mt-1 max-w-[80ch] text-[12px] leading-5 text-muted">
              {event.description}
            </p>
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex text-[11px] font-medium text-accent underline decoration-rule underline-offset-4 hover:decoration-accent"
            >
              {strings.events.source}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
