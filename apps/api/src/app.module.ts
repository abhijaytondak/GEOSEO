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
import { JobQueue } from "./modules/queue.service";
import { OpportunitiesStore } from "./modules/opportunities.service";
import { ContentController } from "./modules/content.controller";
import { ContentStore } from "./modules/content.service";
import { SettingsController } from "./modules/settings.controller";
import { SettingsStore } from "./modules/settings.service";
import { WorkspaceController } from "./modules/workspace.controller";
import { WorkspaceStore } from "./modules/workspace.service";
import { SearchController } from "./modules/search.controller";
import { SearchService } from "./modules/search.service";
import { OverviewController } from "./modules/overview.controller";
import { AuditController } from "./modules/audit.controller";
import { AuditStore } from "./modules/audit.service";
import { SiteThemeController } from "./modules/site-theme.controller";
import { SiteThemeStore } from "./modules/site-theme.service";
import { LeadActivityController } from "./modules/lead-activity.controller";
import { LeadActivityStore } from "./modules/lead-activity.service";
import { LeadJourneyController, PublicEventsController } from "./modules/lead-journey.controller";
import { LeadJourneyStore } from "./modules/lead-journey.service";
import { LeadAssignmentController } from "./modules/lead-assignment.controller";
import { LeadAssignmentStore } from "./modules/lead-assignment.service";
import { LeadScoreController } from "./modules/lead-score.controller";
import { LeadScoreStore } from "./modules/lead-score.service";
import { SolutionsController } from "./modules/solutions.controller";
import { PublicThrottleGuard } from "./common/public-throttle.guard";
import {
  OpportunitiesController,
  BlueprintsController,
  PagesController,
  LeadsController,
  PublicController,
  MonitoringController,
  PublishingController,
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
    PublishingController,
    WorkspaceController,
    SearchController,
    OverviewController,
    AuditController,
    SiteThemeController,
    LeadActivityController,
    LeadJourneyController,
    PublicEventsController,
    LeadAssignmentController,
    LeadScoreController,
    SolutionsController,
  ],
  providers: [
    OutreachStore,
    AlertsStore,
    BrandMemoryStore,
    JobQueue,
    JobsStore,
    OpportunitiesStore,
    ContentStore,
    SettingsStore,
    WorkspaceStore,
    PageEngineStore,
    SearchService,
    AuditStore,
    SiteThemeStore,
    LeadActivityStore,
    LeadJourneyStore,
    LeadAssignmentStore,
    LeadScoreStore,
    { provide: APP_GUARD, useClass: BearerGuard },
    { provide: APP_GUARD, useClass: PublicThrottleGuard },
  ],
})
export class AppModule {}
