import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { SITE_URL, BRAND } from "@/components/marketing/data";

const DESCRIPTION =
  "GEOSEO methodology — how we ground content in real brand facts, write answer-first pages, score citation-worthiness, and measure results in Google Search Console. No fabricated stats, no thin pages.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Methodology — ${BRAND}`,
  description: DESCRIPTION,
  alternates: { canonical: "/methodology" },
  openGraph: { title: `Methodology — ${BRAND}`, description: DESCRIPTION, url: `${SITE_URL}/methodology`, siteName: BRAND, type: "website" },
  robots: { index: true, follow: true },
};

export default function MethodologyPage() {
  return (
    <LegalPage
      title="Our methodology"
      kicker="How it works"
      path="/methodology"
      updated="July 1, 2026"
      intro="How GEOSEO produces content that ranks in Google and gets cited by AI answer engines — and the guardrails that keep it accurate. This is the playbook, in the open."
      sections={[
        {
          heading: "1. Ground everything in Brand Memory",
          body: (
            <p>
              Before we write a word, we build <strong>Brand Memory</strong> — a structured record of your products,
              audience, positioning, proof points, and voice, extracted from your own site and refined with you.
              Every generated page is grounded in that record. If a fact isn&apos;t in Brand Memory, the model is
              instructed to stay qualitative rather than invent a number, customer, or claim. Fabricated specifics
              fail our checks and don&apos;t ship.
            </p>
          ),
        },
        {
          heading: "2. Write answer-first, for humans and machines",
          body: (
            <>
              <p>
                AI answer engines quote the sentence that most cleanly answers the question. So each section opens
                with a direct, self-contained answer — a definition or a crisp claim — and then expands. Pages carry
                a &quot;quick answer&quot; block, FAQs with standalone answers, and comparison tables where they help.
              </p>
              <p>
                The same structure serves Google: clear headings, sufficient depth, and internal links that build
                topical authority instead of chasing volume with thin pages.
              </p>
            </>
          ),
        },
        {
          heading: "3. Make pages machine-readable (GEO/AEO)",
          body: (
            <ul>
              <li>Rich JSON-LD <code>@graph</code> — Organization, WebSite, Article/FAQ, Breadcrumb, and <code>speakable</code> — on every page.</li>
              <li><code>llms.txt</code> and a clean sitemap so AI crawlers can discover and understand your content.</li>
              <li>Extractable formats — quotable blockquotes, key-fact lists, and semantic tables — that answer engines lift verbatim.</li>
            </ul>
          ),
        },
        {
          heading: "4. Score citation-worthiness before shipping",
          body: (
            <p>
              Every draft is scored 0–100 for how likely an AI engine is to cite it, across five weighted
              dimensions: answer-block clarity, self-containment, readability, factual density, and uniqueness. A
              draft that scores below the deterministic template baseline — or that is too thin — is rejected in
              favour of the safer version. The engine never ships content worse than its own floor.
            </p>
          ),
        },
        {
          heading: "5. Measure what actually happened",
          body: (
            <p>
              We connect <strong>Google Search Console</strong> for real rankings, impressions, clicks, and the exact
              queries you appear for — not estimates. Where data isn&apos;t connected yet, the product says so plainly
              rather than presenting a guess as a fact.
            </p>
          ),
        },
        {
          heading: "What we won't do",
          body: (
            <p>
              No fabricated statistics or testimonials, no scaled thin-content spam, no cloaking, and no dark
              patterns. GEO and SEO reward genuine, well-structured expertise — that&apos;s the only durable strategy,
              and it&apos;s the one we build for. Questions? <Link href="/demo">Talk to us</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
