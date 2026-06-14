import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../common/public.decorator";
import { resolveMode, authRequired } from "../common/mode";
import { dbEnabled, dbPing } from "../db/db";

@ApiTags("admin")
@Controller("health")
export class HealthController {
  @Public()
  @Get()
  async health() {
    const mode = resolveMode();
    // Probe the DB, don't trust env presence: a configured-but-unreachable DB
    // (DNS/outage) means stores fell back to in-memory — report "degraded", not "postgres".
    const ping = await dbPing();
    const persistence = !dbEnabled ? "memory" : ping.reachable ? "postgres" : "degraded";
    return {
      status: persistence === "degraded" ? "degraded" : "ok",
      mode,
      persistence,
      dbReachable: ping.reachable,
      authRequired: authRequired(mode),
    };
  }
}
