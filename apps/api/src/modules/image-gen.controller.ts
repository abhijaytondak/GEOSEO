import { Body, Controller, Get, Inject, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ImageGenStore, type ImageKind } from "./image-gen.service";
import { validateBody, v } from "../common/validation";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

const KINDS: ImageKind[] = ["hero", "infographic", "illustration", "og"];
const GenSchema = {
  subject: v.string({ min: 1, max: 240 }),
  kind: v.optional(v.enumOf(KINDS)),
};

@ApiTags("images")
@Controller("images")
export class ImageGenController {
  constructor(@Inject(ImageGenStore) private readonly images: ImageGenStore) {}

  @Get()
  async list(@Req() req: TenantRequest) {
    return { images: await this.images.list(resolveTenantId(req)), provider: this.images.source, configured: this.images.configured };
  }

  /** Generate a brand- + theme-aware image (or a theme-aware placeholder when unconfigured). */
  @Post("generate")
  async generate(@Req() req: TenantRequest, @Body(validateBody(GenSchema)) body: { subject: string; kind?: ImageKind }) {
    const image = await this.images.generate(resolveTenantId(req), body.subject, body.kind ?? "hero", new Date().toISOString());
    return { image };
  }
}
