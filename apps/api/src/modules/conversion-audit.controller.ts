import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConversionAuditStore } from "./conversion-audit.service";
import { validateBody, v } from "../common/validation";

const RunSchema = { url: v.string({ min: 3, max: 2048 }) };

@ApiTags("conversion-audit")
@Controller("conversion-audit")
export class ConversionAuditController {
  constructor(@Inject(ConversionAuditStore) private readonly audit: ConversionAuditStore) {}

  @Get()
  latest() {
    return { audit: this.audit.latest() };
  }

  @Post("run")
  async run(@Body(validateBody(RunSchema)) body: { url: string }) {
    const audit = await this.audit.run(body.url.trim(), new Date().toISOString());
    return { audit };
  }
}
