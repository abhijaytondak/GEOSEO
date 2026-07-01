import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { SITE_URL, BRAND } from "@/components/marketing/data";

const DESCRIPTION =
  "About GEOSEO — the platform that helps brands get found in Google search AND cited by AI answer engines like ChatGPT, Perplexity, and Google AI Overviews.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `About — ${BRAND}`,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { title: `About — ${BRAND}`, description: DESCRIPTION, url: `${SITE_URL}/about`, siteName: BRAND, type: "website" },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return (
    <LegalPage
      title="About GEOSEO"
      kicker="Company"
      path="/about"
      intro="GEOSEO helps brands get found where buyers now look — in Google search and in AI answers from ChatGPT, Perplexity, and Google AI Overviews. We turn your real business facts into content that ranks, gets cited, and converts."
      sections={[
        {
          heading: "Why we exist",
          body: (
            <>
              <p>
                Search is splitting in two. People still type queries into Google, but a fast-growing share now
                ask an AI assistant and read a synthesized answer — often without clicking a single link. Being
                invisible to those answer engines is the new version of being on page two.
              </p>
              <p>
                GEOSEO exists to make brands visible in both worlds at once: traditional SEO for Google, and
                <strong> generative &amp; answer engine optimization (GEO/AEO)</strong> for the AI systems that increasingly
                sit between a question and your product.
              </p>
            </>
          ),
        },
        {
          heading: "What we do",
          body: (
            <ul>
              <li><strong>Brand Memory</strong> — a grounded source of truth about your business, so generated content uses real facts, never invented ones.</li>
              <li><strong>Page Engine</strong> — generates and publishes answer-first, schema-rich pages built to rank and be cited.</li>
              <li><strong>AI Feed</strong> — JSON-LD, <code>llms.txt</code>, and clean structure on every page so AI crawlers can read and quote you.</li>
              <li><strong>Leads</strong> — captures, scores, and routes the inbound that visibility creates.</li>
              <li><strong>Analytics</strong> — connects Google Search Console for real rankings, plus AI-citation tracking.</li>
            </ul>
          ),
        },
        {
          heading: "How we think about quality",
          body: (
            <p>
              We are deliberately anti-spam. GEOSEO grounds content in your Brand Memory and refuses to fabricate
              statistics, customers, or claims. Every page is scored for citation-worthiness before it ships, and
              thin or low-quality drafts are rejected rather than published. Read more on our{" "}
              <Link href="/methodology">methodology page</Link>.
            </p>
          ),
        },
        {
          heading: "Where we are",
          body: (
            <p>
              We&apos;re an early-stage product working with founding customers. We&apos;d rather be honest about our
              stage than invent a logo wall — the results should speak for themselves. If you want to see what
              GEOSEO can do for your brand, start with a{" "}
              <Link href="/#audit">free AI-visibility audit</Link> or <Link href="/demo">book a demo</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
