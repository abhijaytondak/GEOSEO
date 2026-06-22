/**
 * Renders generated section copy as real semantic HTML — paragraphs, bullet
 * lists, and numbered lists — instead of one flat <p> blob. The LLM drafter is
 * told to use blank-line paragraph breaks and "- " / "1." list markers (see
 * RICH_CONTENT_RULES); this turns that into <p>/<ul>/<ol> so the page reads
 * well AND gives Google + AI crawlers proper structure to parse.
 */
type Block = { type: "p" | "ul" | "ol"; items: string[] };

function parseBlocks(text: string): Block[] {
  const lines = (text ?? "").replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let cur: Block | null = null;
  const flush = () => {
    if (cur) blocks.push(cur);
    cur = null;
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const ul = line.match(/^[-*•]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (ul) {
      if (!cur || cur.type !== "ul") {
        flush();
        cur = { type: "ul", items: [] };
      }
      cur.items.push(ul[1]);
    } else if (ol) {
      if (!cur || cur.type !== "ol") {
        flush();
        cur = { type: "ol", items: [] };
      }
      cur.items.push(ol[1]);
    } else {
      if (!cur || cur.type !== "p") {
        flush();
        cur = { type: "p", items: [] };
      }
      cur.items.push(line);
    }
  }
  flush();
  return blocks;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Wrap any of `highlight` keyword phrases found in `text` in <mark> (case-insensitive). */
function markKeywords(text: string, highlight: string[] | undefined, keyPrefix: string): React.ReactNode[] {
  const terms = (highlight ?? []).map((t) => t.trim()).filter((t) => t.length >= 2);
  if (!terms.length) return [text];
  const re = new RegExp(`(${terms.map(escapeRe).join("|")})`, "gi");
  return text.split(re).map((part, i) =>
    re.test(part) && terms.some((t) => t.toLowerCase() === part.toLowerCase())
      ? <mark key={`${keyPrefix}-h${i}`} className="rounded bg-brand/20 px-0.5 font-medium text-brand">{part}</mark>
      : part,
  );
}

/** Inline emphasis: **bold** → <strong>, plus optional keyword highlighting. */
function inline(text: string, keyPrefix: string, highlight?: string[]): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) return <strong key={`${keyPrefix}-${i}`}>{m[1]}</strong>;
    return <span key={`${keyPrefix}-${i}`}>{markKeywords(part, highlight, `${keyPrefix}-${i}`)}</span>;
  });
}

/** `dense` = the in-app editor preview (smaller, muted); default = the public /feeds page.
 *  `highlight` = keyword phrases to <mark> in the body (review "highlight keywords" mode). */
export function RichText({ text, dense = false, highlight }: { text: string; dense?: boolean; highlight?: string[] }) {
  const blocks = parseBlocks(text);
  if (blocks.length === 0) return null;
  const txt = dense ? "text-[13px] leading-relaxed text-muted-foreground" : "text-[15px] leading-relaxed text-foreground/80";
  return (
    <div className={dense ? "space-y-2" : "space-y-2.5"}>
      {blocks.map((b, i) => {
        if (b.type === "ul")
          return (
            <ul key={i} className={`list-disc space-y-1 pl-5 ${txt}`}>
              {b.items.map((it, j) => (
                <li key={j}>{inline(it, `${i}-${j}`, highlight)}</li>
              ))}
            </ul>
          );
        if (b.type === "ol")
          return (
            <ol key={i} className={`list-decimal space-y-1 pl-5 ${txt}`}>
              {b.items.map((it, j) => (
                <li key={j}>{inline(it, `${i}-${j}`, highlight)}</li>
              ))}
            </ol>
          );
        return (
          <p key={i} className={txt}>
            {inline(b.items.join(" "), `${i}`, highlight)}
          </p>
        );
      })}
    </div>
  );
}
