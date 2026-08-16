import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import PageHero from '../components/PageHero';
import { publicApi } from '../services/api';

function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-BD', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '';
  }
}

function StreamPlayer({ stream }) {
  if (!stream) return null;
  const src = stream.embedUrl || stream.streamUrl;
  const isHls = /\.m3u8(\?|$)/i.test(src || '');

  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-900 text-sm text-white/70">
        Stream link not configured yet.
      </div>
    );
  }

  if (isHls) {
    return (
      <video
        className="aspect-video w-full rounded-2xl bg-black"
        controls
        autoPlay
        playsInline
        src={src}
      />
    );
  }

  return (
    <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-lg">
      <iframe
        title={stream.title}
        src={src}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export default function LivePage() {
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    publicApi
      .getLiveStreams()
      .then((res) => setFeed(res.data.data))
      .catch(() => setError('Unable to load live stream right now.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const live = feed?.live;
  const upcoming = feed?.upcoming || [];
  const recent = feed?.recent || [];

  return (
    <PublicLayout
      title={live ? `Live: ${live.title}` : 'Live Stream'}
      description={live?.description || 'Watch Show Terra Flight live streams, fare updates, and Q&A sessions.'}
    >
      <PageHero
        title={live ? 'We are live' : 'Live Stream'}
        subtitle={
          live
            ? live.title
            : 'Fare updates, Umrah briefings, and travel Q&A — watch here when we go live.'
        }
      />

      <section className="container-page py-12 md:py-16">
        {loading && !feed && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading stream…
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {live ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Live now
              </span>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{live.title}</h1>
            </div>
            <StreamPlayer stream={live} />
            {live.description && (
              <p className="max-w-3xl text-base leading-relaxed text-slate-600">{live.description}</p>
            )}
            {live.streamUrl && (
              <a
                href={live.streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm font-medium text-brand-700 hover:underline"
              >
                Open on {live.platform === 'youtube' ? 'YouTube' : live.platform === 'facebook' ? 'Facebook' : 'source'} →
              </a>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 text-center md:p-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <span className="h-3 w-3 rounded-full bg-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">No live broadcast right now</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Check upcoming sessions below, or book a ticket while you wait.
            </p>
            <Link to="/booking" className="btn-accent mt-6 inline-flex">
              Book Your Ticket
            </Link>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="mt-14">
            <h2 className="section-title">Upcoming</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {upcoming.map((s) => (
                <article key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Scheduled</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{s.title}</h3>
                  {s.scheduledAt && (
                    <p className="mt-1 font-mono text-xs text-slate-500">{formatWhen(s.scheduledAt)}</p>
                  )}
                  {s.description && (
                    <p className="mt-2 line-clamp-3 text-sm text-slate-600">{s.description}</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}

        {recent.length > 0 && (
          <div className="mt-14">
            <h2 className="section-title">Recent streams</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((s) => (
                <article key={s.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  {s.thumbnailUrl ? (
                    <img src={s.thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-slate-100 text-slate-400 text-sm">
                      Ended
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900">{s.title}</h3>
                    {s.endedAt && (
                      <p className="mt-1 text-xs text-slate-500">{formatWhen(s.endedAt)}</p>
                    )}
                    {s.streamUrl && (
                      <a
                        href={s.streamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline"
                      >
                        Watch recording →
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
