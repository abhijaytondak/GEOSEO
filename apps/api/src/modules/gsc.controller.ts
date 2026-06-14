import { Controller, Get, Inject, Query } from "@nestjs/common";
import { ApiTags, ApiQuery } from "@nestjs/swagger";
import { GscService } from "./gsc.service";

@ApiTags("gsc")
@Controller("gsc")
export class GscController {
  constructor(@Inject(GscService) private readonly gsc: GscService) {}

  @Get("status")
  status() {
    return { configured: this.gsc.configured, siteUrl: this.gsc.configured ? this.gsc.siteUrl : undefined };
  }

  /** Real Search Analytics rows (time series by default); null rows + configured:false when unkeyed. */
  @Get("search-analytics")
  @ApiQuery({ name: "range", required: false, enum: ["7d", "30d", "8w", "quarter"] })
  @ApiQuery({ name: "dimension", required: false, enum: ["date", "query", "page"] })
  async searchAnalytics(@Query("range") range = "30d", @Query("dimension") dimension: "date" | "query" | "page" = "date") {
    const dim = dimension === "query" || dimension === "page" ? dimension : "date";
    const rows = await this.gsc.searchAnalytics(range, dim);
    return { configured: this.gsc.configured, dimension: dim, range, rows: rows ?? [] };
  }

  @Get("top-queries")
  async topQueries(@Query("range") range = "30d") {
    const rows = await this.gsc.searchAnalytics(range, "query");
    return { configured: this.gsc.configured, queries: rows ?? [] };
  }
}
