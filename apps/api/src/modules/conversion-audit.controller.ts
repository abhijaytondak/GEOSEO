import { BadRequestException, Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConversionAuditStore } from "./conversion-audit.service";

@ApiTags("conversion-audit")
@Controller("conversion-audit")
export class ConversionAuditController {
  constructor(@Inject(ConversionAuditStore) private readonly audit: ConversionAuditStore) {}

  @Get()
  latest() {
    return { audit: this.audit.latest() };
  }

  @Post("run")
  async run(@Body() body: { url?: string }) {
    if (!body?.url?.trim()) throw new BadRequestException("url is required");
    const audit = await this.audit.run(body.url.trim(), new Date().toISOString());
    return { audit };
  }
}
