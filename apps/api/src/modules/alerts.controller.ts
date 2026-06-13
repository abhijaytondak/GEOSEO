import { Body, Controller, Get, Inject, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { ApiTags, ApiQuery } from "@nestjs/swagger";
import type { AlertSeverity, AlertType, SeoDataProvider } from "@geoseo/types";
import { SEO_PROVIDER } from "../seo/seo.module";
import { AlertsStore } from "./alerts.service";
import { AuditStore } from "./audit.service";
import { validateBody } from "../common/validation";
import { AlertThresholdsSchema, AlertSnoozeSchema } from "../common/schemas";

@ApiTags("alerts")
@Controller("alerts")
export class AlertsController {
  constructor(
    @Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider,
    @Inject(AlertsStore) private readonly store: AlertsStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get()
  @ApiQuery({ name: "severity", required: false })
  @ApiQuery({ name: "type", required: false })
  async list(@Query("severity") severity?: AlertSeverity, @Query("type") type?: AlertType) {
    let alerts = await this.seo.getAlerts();
    if (severity) alerts = alerts.filter((a) => a.severity === severity);
    if (type) alerts = alerts.filter((a) => a.type === type);
    const withRead = alerts.map((a) => ({
      ...a,
      read: this.store.isRead(a.id),
      resolved: this.store.isResolved(a.id),
      snoozedUntil: this.store.snoozedUntil(a.id),
    }));
    return { alerts: withRead, unread: withRead.filter((a) => !a.read).length };
  }

  @Get("thresholds")
  thresholds() {
    return { thresholds: this.store.getThresholds() };
  }

  @Post("mark-all-read")
  markAllRead(@Body() body: { ids?: string[] }) {
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    return { ids: this.store.markAllRead(ids), read: true };
  }

  @Put("thresholds")
  updateThresholds(@Body(validateBody(AlertThresholdsSchema)) body: Partial<ReturnType<AlertsStore["getThresholds"]>>) {
    return { thresholds: this.store.updateThresholds(body) };
  }

  @Post(":id/resolve")
  resolve(@Param("id") id: string) {
    this.store.resolve(id);
    this.audit.record("resolve", "alert", id);
    return { id, read: true, resolved: true };
  }

  @Post(":id/snooze")
  snooze(@Param("id") id: string, @Body(validateBody(AlertSnoozeSchema)) body: { until?: string }) {
    const snoozedUntil = this.store.snooze(id, body?.until);
    this.audit.record("snooze", "alert", id);
    return { id, snoozedUntil };
  }

  @Patch(":id")
  markRead(@Param("id") id: string) {
    this.store.markRead(id);
    return { id, read: true };
  }
}
