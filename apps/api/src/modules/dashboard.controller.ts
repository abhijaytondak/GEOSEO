import { Controller, Get, Inject } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { SeoDataProvider } from "@geoseo/types";
import { SEO_PROVIDER } from "../seo/seo.module";

/** Supporting endpoints the UI needs that the original draft omitted.
 *  (brand-profile now lives in BrandController.) */
@ApiTags("dashboard")
@Controller()
export class DashboardController {
  constructor(@Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider) {}

  @Get("dashboard/kpis")
  async kpis() {
    return { kpis: await this.seo.getKpis() };
  }

  @Get("backlinks")
  async backlinks() {
    const backlinks = await this.seo.getBacklinks();
    const byStatus = backlinks.reduce<Record<string, number>>((acc, b) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1;
      return acc;
    }, {});
    return { backlinks, total: backlinks.length, byStatus };
  }

  @Get("activity")
  async activity() {
    return { activity: await this.seo.getActivity() };
  }
}
