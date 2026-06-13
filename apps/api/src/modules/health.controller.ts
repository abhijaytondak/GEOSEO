import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../common/public.decorator";
import { resolveMode, persistenceKind, authRequired } from "../common/mode";

@ApiTags("admin")
@Controller("health")
export class HealthController {
  @Public()
  @Get()
  health() {
    const mode = resolveMode();
    return {
      status: "ok",
      mode,
      persistence: persistenceKind(),
      authRequired: authRequired(mode),
    };
  }
}
