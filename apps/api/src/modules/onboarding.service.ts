import { Injectable } from "@nestjs/common";
import type { OnboardingStatus } from "@geoseo/types";
import { DocStore } from "../db/db";

const EMPTY: OnboardingStatus = {
  completed: false,
  requestedIntegrations: [],
  steps: {
    websiteScanned: false,
    brandSaved: false,
    themeScanned: false,
    publishingConfigured: false,
    opportunitiesSeeded: false,
  },
};

/**
 * Self-serve onboarding state (per workspace) — persisted to `cx_onboarding`.
 * Tracks the company's captured identity, requested integrations, and which
 * setup steps are done so the platform knows a company is live (not seed data).
 */
/**
 * Per-tenant onboarding state (multi-tenant pattern — docs/MULTI-TENANCY.md, P0-6).
 * Each workspace tracks its own setup progress; `ws-default` maps to the legacy "state" row.
 */
@Injectable()
export class OnboardingStore {
  private cache = new Map<string, OnboardingStatus>();
  private db = new DocStore<OnboardingStatus>("cx_onboarding");

  private async state(tenantId: string): Promise<OnboardingStatus> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = await this.db.loadForTenant(tenantId);
    const s: OnboardingStatus = loaded
      ? { ...EMPTY, ...loaded, steps: { ...EMPTY.steps, ...(loaded.steps ?? {}) } }
      : { ...EMPTY, steps: { ...EMPTY.steps } };
    this.cache.set(tenantId, s);
    return s;
  }
  private persist(tenantId: string, s: OnboardingStatus) {
    this.cache.set(tenantId, s);
    this.db.saveForTenant(tenantId, s);
  }

  async get(tenantId: string): Promise<OnboardingStatus> {
    return this.state(tenantId);
  }

  /** Merge partial progress (called as the company advances through steps). */
  async patch(tenantId: string, update: Partial<OnboardingStatus>): Promise<OnboardingStatus> {
    const cur = await this.state(tenantId);
    const next: OnboardingStatus = {
      ...cur,
      ...update,
      steps: { ...cur.steps, ...(update.steps ?? {}) },
      requestedIntegrations: update.requestedIntegrations ?? cur.requestedIntegrations,
    };
    if (!next.startedAt) next.startedAt = new Date().toISOString();
    this.persist(tenantId, next);
    return next;
  }

  async complete(tenantId: string, update: Partial<OnboardingStatus>): Promise<OnboardingStatus> {
    const cur = await this.state(tenantId);
    const next: OnboardingStatus = {
      ...cur,
      ...update,
      completed: true,
      completedAt: new Date().toISOString(),
      startedAt: cur.startedAt ?? new Date().toISOString(),
      steps: { ...cur.steps, ...(update.steps ?? {}) },
      requestedIntegrations: update.requestedIntegrations ?? cur.requestedIntegrations,
    };
    this.persist(tenantId, next);
    return next;
  }

  async reset(tenantId: string): Promise<OnboardingStatus> {
    const next: OnboardingStatus = { ...EMPTY, steps: { ...EMPTY.steps } };
    this.persist(tenantId, next);
    return next;
  }
}
