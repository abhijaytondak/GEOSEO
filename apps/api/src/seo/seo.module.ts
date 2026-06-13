import { Global, Module } from "@nestjs/common";
import { seoProvider, brandSource, outreachDrafter } from "@geoseo/mock";

/** DI tokens for the data layer. Bound to the mock implementations today;
 *  rebind to DataForSEO (SEO_PROVIDER), Claude (OUTREACH_DRAFTER), and the
 *  brand-memory product (BRAND_SOURCE) in production — controllers don't change. */
export const SEO_PROVIDER = "SEO_PROVIDER";
export const BRAND_SOURCE = "BRAND_SOURCE";
export const OUTREACH_DRAFTER = "OUTREACH_DRAFTER";

@Global()
@Module({
  providers: [
    { provide: SEO_PROVIDER, useValue: seoProvider },
    { provide: BRAND_SOURCE, useValue: brandSource },
    { provide: OUTREACH_DRAFTER, useValue: outreachDrafter },
  ],
  exports: [SEO_PROVIDER, BRAND_SOURCE, OUTREACH_DRAFTER],
})
export class SeoModule {}
