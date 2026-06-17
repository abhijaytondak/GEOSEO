import { BadRequestException, Controller, Get, Inject, Query, Req } from "@nestjs/common";
import { ApiTags, ApiQuery } from "@nestjs/swagger";
import { SearchService } from "./search.service";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

const MAX_QUERY = 256; // PRD §15
const MAX_LIMIT = 50;

@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(@Inject(SearchService) private readonly search: SearchService) {}

  @Get()
  @ApiQuery({ name: "q", required: true })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "offset", required: false })
  run(
    @Req() req: TenantRequest,
    @Query("q") q?: string,
    @Query("type") type?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const query = (q ?? "").slice(0, MAX_QUERY + 1);
    if (query.length > MAX_QUERY) throw new BadRequestException(`Query exceeds ${MAX_QUERY} characters`);
    const l = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(limit ?? "10", 10) || 10));
    const o = Math.max(0, Number.parseInt(offset ?? "0", 10) || 0);
    return this.search.search(resolveTenantId(req), query, { type, limit: l, offset: o });
  }
}
