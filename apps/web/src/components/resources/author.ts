/**
 * The named author for resource articles — a real person, for E-E-A-T.
 * Google (and AI answer engines) weight content with a visible, consistent human
 * author over anonymous/organization-only bylines. One config so the byline and
 * the Person JSON-LD can never drift apart.
 *
 * Honest by construction: no fabricated credentials or profiles. Add `sameAs`
 * URLs (LinkedIn/X) only when they are real, public profiles you want linked.
 */
export const AUTHOR = {
  name: "Abhijay Tondak",
  role: "Founder, Citensity",
  /** Where the byline links — the about page hosts the human/company story. */
  href: "/about",
  /** Real public profiles only (e.g. LinkedIn). Empty until provided — never invented. */
  sameAs: [] as string[],
};
