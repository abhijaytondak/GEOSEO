import { BadRequestException, Body, Controller, Delete, Get, Inject, NotFoundException, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ImageGenStore, type ImageKind } from "./image-gen.service";
import { validateBody, v } from "../common/validation";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

const KINDS: ImageKind[] = ["hero", "infographic", "illustration", "og"];
const GenSchema = {
  subject: v.string({ min: 1, max: 240 }),
  kind: v.optional(v.enumOf(KINDS)),
};
const PatchSchema = {
  altText: v.optional(v.string({ min: 0, max: 240 })),
  label: v.optional(v.string({ min: 0, max: 240 })),
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

  /** Delete a generated image asset by id. */
  @Delete(":id")
  async deleteAsset(@Req() req: TenantRequest, @Param("id") id: string) {
    if (!id) throw new BadRequestException("id is required");
    await this.images.deleteAsset(resolveTenantId(req), id);
    return { id, deleted: true };
  }

  /** Update the subject/label/altText of a generated image asset. */
  @Patch(":id")
  async updateAsset(
    @Req() req: TenantRequest,
    @Param("id") id: string,
    @Body(validateBody(PatchSchema)) body: { altText?: string; label?: string },
  ) {
    if (!id) throw new BadRequestException("id is required");
    const image = await this.images.updateAsset(resolveTenantId(req), id, body);
    if (!image) throw new NotFoundException(`Asset ${id} not found`);
    return { image };
  }
}
