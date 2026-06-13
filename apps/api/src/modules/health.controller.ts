import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../common/public.decorator";

@ApiTags("admin")
@Controller("health")
export class HealthController {
  @Public()
  @Get()
  health() {
    return { status: "ok" };
  }
}
