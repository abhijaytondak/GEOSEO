import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { SeoModule } from "./seo/seo.module";
import { BearerGuard } from "./common/bearer.guard";
import { HealthController } from "./modules/health.controller";
import { BacklinkController } from "./modules/backlink.controller";
import { PerformanceController } from "./modules/performance.controller";
import { OutreachController } from "./modules/outreach.controller";
import { OutreachStore } from "./modules/outreach.service";
import { AlertsController } from "./modules/alerts.controller";
import { AlertsStore } from "./modules/alerts.service";
import { DashboardController } from "./modules/dashboard.controller";
import { BrandController } from "./modules/brand.controller";
import { BrandMemoryStore } from "./modules/brand.service";
import { JobsController } from "./modules/jobs.controller";
import { JobsStore } from "./modules/jobs.service";
import { OpportunitiesStore } from "./modules/opportunities.service";
import { ContentController } from "./modules/content.controller";
import { ContentStore } from "./modules/content.service";
import { SettingsController } from "./modules/settings.controller";
import { SettingsStore } from "./modules/settings.service";
import {
  OpportunitiesController,
  BlueprintsController,
  PagesController,
  LeadsController,
  PublicController,
  MonitoringController,
} from "./modules/page-engine.controller";
import { PageEngineStore } from "./modules/page-engine.service";

@Module({
  imports: [SeoModule],
  controllers: [
    HealthController,
    BacklinkController,
    PerformanceController,
    OutreachController,
    AlertsController,
    DashboardController,
    BrandController,
    JobsController,
    ContentController,
    SettingsController,
    OpportunitiesController,
    BlueprintsController,
    PagesController,
    LeadsController,
    PublicController,
    MonitoringController,
  ],
  providers: [
    OutreachStore,
    AlertsStore,
    BrandMemoryStore,
    JobsStore,
    OpportunitiesStore,
    ContentStore,
    SettingsStore,
    PageEngineStore,
    { provide: APP_GUARD, useClass: BearerGuard },
  ],
})
export class AppModule {}
