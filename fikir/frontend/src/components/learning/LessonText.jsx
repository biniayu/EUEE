function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Lightweight formatting: ## headings, **bold**, bullets (- ), paragraphs */
export default function LessonText({ text }) {
  if (!text) {
    return <p className="text-neutral-500">No written content for this lesson.</p>;
  }

  const lines = text.split('\n');
  const blocks = [];
  let i = 0;
  let listItems = [];

  function flushList() {
    if (!listItems.length) return;
    const inner = listItems
      .map((item) => `<li class="ml-4 list-disc text-neutral-700">${item}</li>`)
      .join('');
    blocks.push(`<ul class="my-3 space-y-1 pl-2">${inner}</ul>`);
    listItems = [];
  }

  function formatInline(s) {
    return escapeHtml(s).replace(/\*\*([^*]+)\*\*/g, '<strong class="text-deep-blue">$1</strong>');
  }

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const t = line.trim();

    if (t === '') {
      flushList();
      i += 1;
      continue;
    }

    if (t.startsWith('## ')) {
      flushList();
      blocks.push(
        `<h3 class="mt-6 text-lg font-bold text-deep-blue first:mt-0">${formatInline(t.slice(3))}</h3>`
      );
      i += 1;
      continue;
    }

    if (t.startsWith('- ')) {
      listItems.push(formatInline(t.slice(2)));
      i += 1;
      continue;
    }

    flushList();
    blocks.push(`<p class="my-3 leading-relaxed text-neutral-700">${formatInline(t)}</p>`);
    i += 1;
  }
  flushList();

  return (
    <div
      className="lesson-text prose-lesson max-w-none"
      dangerouslySetInnerHTML={{ __html: blocks.join('') }}
    />
  );
}
