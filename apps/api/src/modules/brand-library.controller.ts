import { BadRequestException, Body, Controller, Delete, Get, Inject, Param, Post, Put, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { validateBody, v } from "../common/validation";
import { BrandLibrarySchema } from "../common/schemas";
import { BrandLibraryStore, type BrandLibrary } from "./brand-library.service";
import { crawlBrandDraft } from "./brand-library.extract";
import { AuditStore } from "./audit.service";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

const CorrectionSchema = { instruction: v.string({ min: 1, max: 600 }) };
const ExtractSchema = { url: v.string({ min: 1, max: 2048 }) };

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

  /** Extract a real Brand Memory draft from the company's own website (PRD §7.1 / §8.1).
   *  SSRF-guarded crawl → LLM structured extraction (DeepSeek) with a heuristic fallback,
   *  plus real brand images scraped from the page. Returns a draft for the user to review;
   *  it does NOT persist until they save via PUT. */
  @Post("extract-from-site")
  async extractFromSite(@Body(validateBody(ExtractSchema)) body: { url: string }) {
    if (!body?.url?.trim()) throw new BadRequestException("url is required");
    const { draft, crawled, llm, source } = await crawlBrandDraft(body.url);
    return { draft, crawled, llm, source };
  }

  /** Full-replace upsert of the structured brand library (products / personas / proof). */
  @Put()
  async replace(@Req() req: TenantRequest, @Body(validateBody(BrandLibrarySchema)) body: Partial<BrandLibrary>) {
    const t = resolveTenantId(req);
    const library = await this.library.replace(t, body, new Date().toISOString());
    this.audit.record("update", "brand", "library");
    return { library, strength: await this.library.strength(t) };
  }

  /** Feedback Memory — append a correction ("fix once, stays fixed everywhere"). */
  @Post("corrections")
  async addCorrection(@Req() req: TenantRequest, @Body(validateBody(CorrectionSchema)) body: { instruction: string }) {
    const t = resolveTenantId(req);
    if (!body?.instruction?.trim()) throw new BadRequestException("instruction is required");
    const library = await this.library.addCorrection(t, body.instruction, new Date().toISOString());
    this.audit.record("update", "brand", "correction");
    return { library, strength: await this.library.strength(t) };
  }

  @Delete("corrections/:id")
  async removeCorrection(@Req() req: TenantRequest, @Param("id") id: string) {
    const t = resolveTenantId(req);
    const library = await this.library.removeCorrection(t, id, new Date().toISOString());
    return { library, strength: await this.library.strength(t) };
  }
}
