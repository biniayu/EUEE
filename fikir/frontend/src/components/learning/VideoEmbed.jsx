function youtubeId(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url, 'https://example.com');
    const host = u.hostname.replace('www.', '');
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id || null;
    }
    if (host.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const m = u.pathname.match(/\/embed\/([^/]+)/);
      if (m) return m[1];
      const s = u.pathname.match(/\/shorts\/([^/]+)/);
      if (s) return s[1];
    }
  } catch {
    return null;
  }
  return null;
}

function vimeoId(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    if (host.includes('vimeo.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      const id = parts[parts.length - 1];
      return /^\d+$/.test(id) ? id : null;
    }
  } catch {
    return null;
  }
  return null;
}

export default function VideoEmbed({ url, title }) {
  if (!url) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center text-sm text-neutral-500">
        No video URL configured for this lesson.
      </div>
    );
  }

  const yid = youtubeId(url);
  if (yid) {
    return (
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-black shadow-md">
        <div className="relative aspect-video w-full">
          <iframe
            title={title || 'Lesson video'}
            src={`https://www.youtube.com/embed/${yid}`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  const vid = vimeoId(url);
  if (vid) {
    return (
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-black shadow-md">
        <div className="relative aspect-video w-full">
          <iframe
            title={title || 'Lesson video'}
            src={`https://player.vimeo.com/video/${vid}`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <video
      controls
      className="w-full rounded-2xl border border-neutral-200 bg-black shadow-md"
      src={url}
      title={title || 'Lesson video'}
    >
      <track kind="captions" />
      Your browser does not support the video tag.
    </video>
  );
}
