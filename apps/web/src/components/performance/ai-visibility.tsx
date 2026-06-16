import type { AiEngine, AiVisibilitySignal } from "@geoseo/types";
import { DeltaChip } from "@/components/dashboard/delta-chip";
import { ProgressBar } from "@/components/dashboard/progress-bar";

/** Gradient pairs per engine — from → to — for the share-of-voice bars. */
const ENGINE_GRAD: Record<AiEngine, [string, string]> = {
  chatgpt: ["#10A37F", "#34D399"],
  perplexity: ["#6C4CF1", "#9B82FF"],
  "google-ai": ["#2D6BFF", "#5B9BFF"],
  gemini: ["#F5A524", "#FFC764"],
};

export function AiVisibility({ signals }: { signals: AiVisibilitySignal[] }) {
  if (signals.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-muted-foreground">
        No AI citations tracked yet. Run a check on the{" "}
        <a href="/ai-search" className="font-medium text-foreground underline underline-offset-2">
          AI Search
        </a>{" "}
        page (or connect a monitoring provider) and your real per-engine mentions appear here.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {signals.map((s, i) => {
        const [from, to] = ENGINE_GRAD[s.engine];
        return (
          <div key={s.engine}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-medium text-foreground">{s.label}</span>
              <div className="flex items-center gap-2">
                <span className="tnum text-[12px] text-muted-foreground">
                  {s.mentions} mentions
                </span>
                <DeltaChip delta={s.delta} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProgressBar value={s.shareOfVoice} from={from} to={to} delay={i * 0.08} />
              <span className="tnum w-9 text-right text-[13px] font-semibold text-foreground">
                {s.shareOfVoice}%
              </span>
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-[11.5px] leading-relaxed text-muted-foreground">
        Share of voice = each engine&apos;s share of your tracked AI citations. Mentions and
        deltas are counted from recorded citation checks; competitor share activates when a
        monitoring provider is connected.
      </p>
    </div>
  );
}
