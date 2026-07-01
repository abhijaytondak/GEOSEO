import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { SITE_URL, BRAND } from "@/components/marketing/data";

const DESCRIPTION =
  "GEOSEO security overview — how we handle your data, the infrastructure we run on, and our approach to safe crawling, secrets, and access. Written honestly for our current stage.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Security — ${BRAND}`,
  description: DESCRIPTION,
  alternates: { canonical: "/security" },
  openGraph: { title: `Security — ${BRAND}`, description: DESCRIPTION, url: `${SITE_URL}/security`, siteName: BRAND, type: "website" },
  robots: { index: true, follow: true },
};

export default function SecurityPage() {
  return (
    <LegalPage
      title="Security"
      kicker="Trust"
      path="/security"
      updated="July 1, 2026"
      intro="How GEOSEO protects your data and runs safely. This is an honest overview of our current practices for an early-stage product — not a claim of formal certification."
      sections={[
        {
          heading: "Infrastructure",
          body: (
            <p>
              GEOSEO runs on established cloud providers: the web app on <strong>Vercel</strong>, the API on
              <strong> Render</strong>, and data in <strong>Supabase (Postgres)</strong> with row-level security.
              Traffic is served over HTTPS, and secrets (API keys, database credentials) are stored as
              environment variables in each provider — never committed to source control.
            </p>
          ),
        },
        {
          heading: "Safe crawling",
          body: (
            <p>
              When GEOSEO reads a website you provide (to build Brand Memory or analyze a competitor), requests go
              through an SSRF-guarded fetch that blocks internal/private addresses and cloud metadata endpoints,
              follows redirects only to safe hosts, and caps response size and time. We read public pages only —
              we never access your CMS or publish anything without your approval.
            </p>
          ),
        },
        {
          heading: "Access & authentication",
          body: (
            <p>
              Workspace access is authenticated, and the product is built for per-workspace tenant isolation.
              Server-side secrets are never exposed to the browser. As we move from open beta to production, we
              enforce authentication on every non-public route.
            </p>
          ),
        },
        {
          heading: "Your data",
          body: (
            <ul>
              <li>We use your data to operate the product for you — grounding content, capturing leads, and reporting results.</li>
              <li>We do not sell your data.</li>
              <li>Generated content is grounded in your Brand Memory; we don&apos;t fabricate claims on your behalf.</li>
              <li>Third-party processors we rely on are listed in our <Link href="/privacy">privacy policy</Link>.</li>
            </ul>
          ),
        },
        {
          heading: "Responsible disclosure",
          body: (
            <p>
              Found a vulnerability? Please report it privately via our <Link href="/demo">contact form</Link> before
              disclosing publicly, and we&apos;ll work with you to fix it quickly. As we scale, we&apos;ll formalize
              our security program (including third-party review); we&apos;ll describe it here honestly as it matures
              rather than claim certifications we don&apos;t yet hold.
            </p>
          ),
        },
      ]}
    />
  );
}
