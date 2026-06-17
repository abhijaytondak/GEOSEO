import { Global, Module } from "@nestjs/common";
import { resolveMode } from "../common/mode";
import { emptySeoProvider, emptyBrandSource, emptyOutreachDrafter } from "./providers/empty.providers";

/** DI tokens for the data layer. In production/staging these bind to honest empty /
 *  setup-required providers (and live seams where wired — DataForSEO, GSC, Brand Memory);
 *  demo binds the mock implementations. Controllers don't change. */
export const SEO_PROVIDER = "SEO_PROVIDER";
export const BRAND_SOURCE = "BRAND_SOURCE";
export const OUTREACH_DRAFTER = "OUTREACH_DRAFTER";

/**
 * Resolve the data-layer providers by mode (No-Dummy-Data §6.1, P0-4). Demo loads the
 * mock providers via dynamic import (the only API path to `@geoseo/mock`, allowlisted),
 * so mock is never loaded or bound in production. Memoized so all three tokens share one
 * resolution.
 */
let providersP: Promise<{
  seo: typeof emptySeoProvider;
  brand: typeof emptyBrandSource;
  outreach: typeof emptyOutreachDrafter;
}> | null = null;

function resolveProviders() {
  if (!providersP) {
    providersP = (async () => {
      if (resolveMode() === "demo") {
        const m = await import("./providers/demo.providers");
        return { seo: m.seoProvider, brand: m.brandSource, outreach: m.outreachDrafter };
      }
      return { seo: emptySeoProvider, brand: emptyBrandSource, outreach: emptyOutreachDrafter };
    })();
  }
  return providersP;
}

@Global()
@Module({
  providers: [
    { provide: SEO_PROVIDER, useFactory: async () => (await resolveProviders()).seo },
    { provide: BRAND_SOURCE, useFactory: async () => (await resolveProviders()).brand },
    { provide: OUTREACH_DRAFTER, useFactory: async () => (await resolveProviders()).outreach },
  ],
  exports: [SEO_PROVIDER, BRAND_SOURCE, OUTREACH_DRAFTER],
})
export class SeoModule {}
