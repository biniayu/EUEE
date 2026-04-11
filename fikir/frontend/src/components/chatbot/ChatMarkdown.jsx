import { useMemo } from 'react';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMd(s) {
  const links = [];
  let x = String(s).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_m, label, url) => {
    links.push({ label, url });
    return `@@L${links.length - 1}@@`;
  });

  x = escapeHtml(x);

  for (let i = 0; i < links.length; i += 1) {
    const { label, url } = links[i];
    const a = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="font-medium text-brand-emerald underline decoration-brand-emerald/40 underline-offset-2 hover:text-deep-blue">${escapeHtml(label)}</a>`;
    x = x.split(`@@L${i}@@`).join(a);
  }

  x = x.replace(
    /`([^`]+)`/g,
    (_m, c) =>
      `<code class="rounded bg-white/80 px-1 py-0.5 font-mono text-xs text-deep-blue ring-1 ring-neutral-200/80">${escapeHtml(c)}</code>`
  );
  x = x.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-neutral-900">$1</strong>');
  return x;
}

/** Basic markdown: ``` fences, ##/###, **bold**, `code`, - lists, [text](https://...) */
function formatMarkdown(src) {
  if (!src) return '';
  const fences = [];
  let t = String(src);
  t = t.replace(/```([\s\S]*?)```/g, (_, code) => {
    const id = fences.length;
    fences.push(
      `<pre class="my-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 font-mono text-xs text-neutral-100">${escapeHtml(code.trim())}</pre>`
    );
    return `\n@@F${id}@@\n`;
  });

  const lines = t.split('\n');
  const parts = [];
  let inUl = false;

  function closeUl() {
    if (inUl) {
      parts.push('</ul>');
      inUl = false;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    const fm = trimmed.match(/^@@F(\d+)@@$/);
    if (fm) {
      closeUl();
      parts.push(fences[Number(fm[1])] || '');
      continue;
    }
    if (trimmed === '') {
      closeUl();
      continue;
    }
    if (trimmed.startsWith('### ')) {
      closeUl();
      parts.push(`<h4 class="mt-2 text-sm font-bold text-deep-blue">${inlineMd(trimmed.slice(4))}</h4>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      closeUl();
      parts.push(`<h3 class="mt-2 text-base font-bold text-deep-blue first:mt-0">${inlineMd(trimmed.slice(3))}</h3>`);
      continue;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inUl) {
        parts.push('<ul class="mt-1.5 list-disc space-y-0.5 pl-4">');
        inUl = true;
      }
      parts.push(`<li class="leading-snug">${inlineMd(trimmed.slice(2))}</li>`);
      continue;
    }
    closeUl();
    parts.push(`<p class="mt-1.5 first:mt-0 leading-relaxed text-neutral-800">${inlineMd(trimmed)}</p>`);
  }
  closeUl();
  return parts.join('');
}

export default function ChatMarkdown({ children }) {
  const html = useMemo(() => formatMarkdown(children || ''), [children]);
  return (
    <div
      className="text-sm leading-relaxed text-neutral-800 [&_a]:break-all"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
