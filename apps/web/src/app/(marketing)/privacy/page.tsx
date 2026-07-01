import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { SITE_URL, BRAND } from "@/components/marketing/data";

const DESCRIPTION = `Privacy policy for ${BRAND} — what data we collect, how we use it, the processors we rely on, and your rights.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Privacy Policy — ${BRAND}`,
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: { title: `Privacy Policy — ${BRAND}`, description: DESCRIPTION, url: `${SITE_URL}/privacy`, siteName: BRAND, type: "website" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      kicker="Legal"
      path="/privacy"
      updated="July 1, 2026"
      intro="This policy explains what information Citensity collects, how we use it, who we share it with, and the choices you have."
      sections={[
        {
          heading: "Information we collect",
          body: (
            <ul>
              <li><strong>Information you provide</strong> — when you request an audit or demo, we collect your email and any company, website, or message you enter.</li>
              <li><strong>Workspace content</strong> — for customers, the brand details, pages, and settings you create in the product.</li>
              <li><strong>Usage data</strong> — basic, privacy-friendly analytics about how the site is used (page views), to improve the product.</li>
            </ul>
          ),
        },
        {
          heading: "How we use it",
          body: (
            <p>
              We use your information to provide and improve Citensity — responding to audit/demo requests, operating
              your workspace, and understanding aggregate usage. We do <strong>not</strong> sell your personal data.
            </p>
          ),
        },
        {
          heading: "Service providers we rely on",
          body: (
            <ul>
              <li><strong>Vercel</strong> — hosting and privacy-friendly web analytics.</li>
              <li><strong>Render</strong> — application/API hosting.</li>
              <li><strong>Supabase</strong> — database storage.</li>
              <li><strong>FormSubmit</strong> — delivering lead-form submissions to our team by email.</li>
              <li><strong>Google Search Console</strong> — search performance data, when a customer connects it.</li>
            </ul>
          ),
        },
        {
          heading: "Cookies & analytics",
          body: (
            <p>
              We keep tracking minimal and use privacy-friendly analytics to measure traffic. We don&apos;t use
              your data for third-party advertising.
            </p>
          ),
        },
        {
          heading: "Data retention",
          body: <p>We keep personal data only as long as needed to provide the service or as required by law, then delete or anonymize it.</p>,
        },
        {
          heading: "Your rights",
          body: (
            <p>
              You can request access to, correction of, or deletion of your personal data. Contact us via the{" "}
              <Link href="/demo">contact form</Link> and we&apos;ll respond promptly. Depending on your location, you
              may have additional rights under laws such as the GDPR or CCPA.
            </p>
          ),
        },
        {
          heading: "Changes & contact",
          body: (
            <p>
              We may update this policy as the product evolves; material changes will be reflected by the date above.
              Questions about privacy? Reach us through the <Link href="/demo">contact form</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
