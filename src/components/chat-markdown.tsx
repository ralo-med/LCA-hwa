import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** LLM이 짝 없는 ** 를 내면 그대로 화면에 보임 — 유효한 쌍만 남김 */
function normalizeBoldMarkers(text: string): string {
  const indices: number[] = [];
  for (let i = 0; i < text.length - 1; i++) {
    if (text[i] === '*' && text[i + 1] === '*') indices.push(i);
  }
  if (indices.length < 2) {
    return text.replace(/\*\*/g, '');
  }

  const paired = new Set<number>();
  for (let i = 0; i + 1 < indices.length; i += 2) {
    const open = indices[i]!;
    const close = indices[i + 1]!;
    const inner = text.slice(open + 2, close);
    if (
      inner.length > 0 &&
      inner.length <= 100 &&
      !inner.includes('\n') &&
      !inner.includes('**')
    ) {
      paired.add(open);
      paired.add(close);
    }
  }

  let result = '';
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '*' && text[i + 1] === '*') {
      if (paired.has(i)) {
        result += '**';
      }
      i++;
      continue;
    }
    result += text[i];
  }
  return result;
}

export function sanitizeChatMarkdown(content: string): string {
  let text = normalizeBoldMarkers(content);
  text = text.replace(/^(\d+\.)\s*\n+(\S)/gm, '$1 $2');
  return text;
}

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((segment) => segment.length > 0)
    .map((segment, idx) => {
      const bold = /^\*\*(.+)\*\*$/.exec(segment);
      if (bold) {
        return (
          <strong
            key={`${keyPrefix}-b-${idx}`}
            className="font-semibold text-primary"
          >
            {bold[1]}
          </strong>
        );
      }
      return <Fragment key={`${keyPrefix}-t-${idx}`}>{segment}</Fragment>;
    });
}

function parseLabelItem(text: string, keyPrefix: string): ReactNode {
  const m = /^(\*\*[^*]+\*\*|[^:\n]{2,40}):\s*(.+)$/.exec(text.trim());
  if (m) {
    const label = m[1]!.replace(/^\*\*|\*\*$/g, '');
    return (
      <>
        <strong className="font-semibold text-primary">{label}</strong>
        {': '}
        {parseInline(m[2]!, `${keyPrefix}-body`)}
      </>
    );
  }
  return <>{parseInline(text, keyPrefix)}</>;
}

type Block =
  | { type: 'p'; text: string }
  | { type: 'ol'; items: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'h'; text: string };

function isLabelLine(line: string): boolean {
  return /^(\*\*[^*]+\*\*|[^:\n]{2,40}):\s+.+/.test(line.trim());
}

function parseBlocks(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i]!.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const heading = /^#{1,3}\s+(.+)/.exec(trimmed);
    if (heading) {
      blocks.push({ type: 'h', text: heading[1]! });
      i++;
      continue;
    }

    if (/^\d+\.\s*$/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i]!.trim();
        if (!t) {
          i++;
          continue;
        }
        const loneNumber = /^\d+\.\s*$/.exec(t);
        if (loneNumber) {
          i++;
          const next = lines[i]?.trim();
          if (next && !/^\d+\./.test(next)) {
            items.push(next);
            i++;
          }
          continue;
        }
        const numbered = /^\d+\.\s+(.+)/.exec(t);
        if (!numbered) break;
        items.push(numbered[1]!);
        i++;
      }
      if (items.length > 0) {
        blocks.push({ type: 'ol', items });
      }
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i]!.trim();
        if (!t) {
          i++;
          continue;
        }
        const bulleted = /^[-*]\s+(.+)/.exec(t);
        if (!bulleted) break;
        items.push(bulleted[1]!);
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (isLabelLine(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i]!.trim();
        if (!t) {
          i++;
          continue;
        }
        if (!isLabelLine(t)) break;
        items.push(t);
        i++;
      }
      if (items.length >= 2) {
        blocks.push({ type: 'ol', items });
        continue;
      }
      blocks.push({ type: 'p', text: trimmed });
      i++;
      continue;
    }

    const paraLines: string[] = [lines[i]!];
    i++;
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !/^(#{1,3}|\d+\.|-|\*)\s/.test(lines[i]!.trim()) &&
      !isLabelLine(lines[i]!.trim())
    ) {
      paraLines.push(lines[i]!);
      i++;
    }
    blocks.push({ type: 'p', text: paraLines.join(' ') });
  }

  return coalesceOrderedLists(blocks);
}

function coalesceOrderedLists(blocks: Block[]): Block[] {
  const result: Block[] = [];

  for (const block of blocks) {
    const prev = result[result.length - 1];
    if (block.type === 'ol' && prev?.type === 'ol') {
      prev.items.push(...block.items);
      continue;
    }
    result.push(
      block.type === 'ol' ? { ...block, items: [...block.items] } : block,
    );
  }

  return result;
}

export function ChatMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = parseBlocks(sanitizeChatMarkdown(content));

  return (
    <div className={cn('space-y-2 leading-relaxed', className)}>
      {blocks.map((block, bi) => {
        if (block.type === 'h') {
          return (
            <p key={bi} className="font-semibold text-primary">
              {parseInline(block.text, `h-${bi}`)}
            </p>
          );
        }
        if (block.type === 'p') {
          return <p key={bi}>{parseInline(block.text, `p-${bi}`)}</p>;
        }
        if (block.type === 'ol') {
          return (
            <ol key={bi} className="my-1 list-none space-y-2.5 pl-0">
              {block.items.map((item, ii) => (
                <li key={ii} className="flex gap-2">
                  <span
                    className="w-5 shrink-0 text-right font-medium text-muted-foreground"
                    aria-hidden
                  >
                    {ii + 1}.
                  </span>
                  <span className="min-w-0 flex-1">
                    {parseLabelItem(item, `ol-${bi}-${ii}`)}
                  </span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul
            key={bi}
            className="my-1 space-y-2 pl-5 list-disc marker:text-primary/60"
          >
            {block.items.map((item, ii) => (
              <li key={ii} className="pl-0.5">
                {parseLabelItem(item, `ul-${bi}-${ii}`)}
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}
