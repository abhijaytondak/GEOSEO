import { Body, Controller, Get, Inject, Put, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { validateBody } from "../common/validation";
import { BrandLibrarySchema } from "../common/schemas";
import { BrandLibraryStore, type BrandLibrary } from "./brand-library.service";
import { AuditStore } from "./audit.service";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

@ApiTags("brand")
@Controller("brand-library")
export class BrandLibraryController {
  constructor(
    @Inject(BrandLibraryStore) private readonly library: BrandLibraryStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get()
  async get(@Req() req: TenantRequest) {
    const t = resolveTenantId(req);
    return { library: await this.library.get(t), strength: await this.library.strength(t) };
  }

  /** Full-replace upsert of the structured brand library (products / personas / proof). */
  @Put()
  async replace(@Req() req: TenantRequest, @Body(validateBody(BrandLibrarySchema)) body: Partial<BrandLibrary>) {
    const t = resolveTenantId(req);
    const library = await this.library.replace(t, body, new Date().toISOString());
    this.audit.record("update", "brand", "library");
    return { library, strength: await this.library.strength(t) };
  }
}
