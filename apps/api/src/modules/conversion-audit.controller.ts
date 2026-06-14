import { Body, Controller, Get, Inject, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConversionAuditStore } from "./conversion-audit.service";
import { validateBody, v } from "../common/validation";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

const RunSchema = { url: v.string({ min: 3, max: 2048 }) };

@ApiTags("conversion-audit")
@Controller("conversion-audit")
export class ConversionAuditController {
  constructor(@Inject(ConversionAuditStore) private readonly audit: ConversionAuditStore) {}

  @Get()
  async latest(@Req() req: TenantRequest) {
    return { audit: await this.audit.latest(resolveTenantId(req)) };
  }

  @Post("run")
  async run(@Req() req: TenantRequest, @Body(validateBody(RunSchema)) body: { url: string }) {
    const audit = await this.audit.run(resolveTenantId(req), body.url.trim(), new Date().toISOString());
    return { audit };
  }
}
