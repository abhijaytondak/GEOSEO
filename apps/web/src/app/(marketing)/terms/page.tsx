import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { SITE_URL, BRAND } from "@/components/marketing/data";

const DESCRIPTION = `Terms of Service for ${BRAND} — the rules for using our website and product.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Terms of Service — ${BRAND}`,
  description: DESCRIPTION,
  alternates: { canonical: "/terms" },
  openGraph: { title: `Terms of Service — ${BRAND}`, description: DESCRIPTION, url: `${SITE_URL}/terms`, siteName: BRAND, type: "website" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      kicker="Legal"
      path="/terms"
      updated="July 1, 2026"
      intro="These terms govern your use of the GEOSEO website and product. By using GEOSEO, you agree to them."
      sections={[
        {
          heading: "Using GEOSEO",
          body: (
            <p>
              GEOSEO provides tools for search and AI-answer optimization — generating and publishing content,
              capturing leads, and reporting performance. You&apos;re responsible for the accuracy of the information
              you provide and for how you use the content the product helps you create.
            </p>
          ),
        },
        {
          heading: "Acceptable use",
          body: (
            <ul>
              <li>Don&apos;t use GEOSEO to publish unlawful, deceptive, or infringing content.</li>
              <li>Don&apos;t attempt to disrupt, reverse-engineer, or gain unauthorized access to the service.</li>
              <li>Don&apos;t use the product to generate spam or misrepresent your business.</li>
            </ul>
          ),
        },
        {
          heading: "Content & ownership",
          body: (
            <p>
              You retain ownership of the brand information you provide and the content you publish. You grant us the
              limited rights needed to operate the service for you. GEOSEO&apos;s own software, brand, and site content
              remain ours.
            </p>
          ),
        },
        {
          heading: "Availability & disclaimers",
          body: (
            <p>
              GEOSEO is offered on an &quot;as is&quot; and &quot;as available&quot; basis. Search and AI-answer
              rankings depend on third parties (Google, AI engines) that we don&apos;t control, so we can&apos;t
              guarantee specific rankings, traffic, or results. We work hard to keep the service reliable but
              don&apos;t warrant uninterrupted availability.
            </p>
          ),
        },
        {
          heading: "Limitation of liability",
          body: (
            <p>
              To the maximum extent permitted by law, GEOSEO isn&apos;t liable for indirect, incidental, or
              consequential damages arising from your use of the service.
            </p>
          ),
        },
        {
          heading: "Changes & contact",
          body: (
            <p>
              We may update these terms as the product evolves; the date above reflects the latest version. Continued
              use after a change means you accept the updated terms. Questions? Use the{" "}
              <Link href="/demo">contact form</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
