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

/** Inline emphasis: **bold** → <strong>. Splits a string into React nodes. */
function inline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    return m ? <strong key={`${keyPrefix}-${i}`}>{m[1]}</strong> : <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

/** `dense` = the in-app editor preview (smaller, muted); default = the public /feeds page. */
export function RichText({ text, dense = false }: { text: string; dense?: boolean }) {
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
                <li key={j}>{inline(it, `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        if (b.type === "ol")
          return (
            <ol key={i} className={`list-decimal space-y-1 pl-5 ${txt}`}>
              {b.items.map((it, j) => (
                <li key={j}>{inline(it, `${i}-${j}`)}</li>
              ))}
            </ol>
          );
        return (
          <p key={i} className={txt}>
            {inline(b.items.join(" "), `${i}`)}
          </p>
        );
      })}
    </div>
  );
}
