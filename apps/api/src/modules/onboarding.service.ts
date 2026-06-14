import { Injectable, OnModuleInit } from "@nestjs/common";
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
@Injectable()
export class OnboardingStore implements OnModuleInit {
  private state: OnboardingStatus = { ...EMPTY };
  private db = new DocStore<OnboardingStatus>("cx_onboarding");

  async onModuleInit() {
    await this.db.init(this.state, (loaded) => {
      this.state = { ...EMPTY, ...loaded, steps: { ...EMPTY.steps, ...(loaded.steps ?? {}) } };
    });
  }

  get(): OnboardingStatus {
    return this.state;
  }

  /** Merge partial progress (called as the company advances through steps). */
  patch(update: Partial<OnboardingStatus>): OnboardingStatus {
    this.state = {
      ...this.state,
      ...update,
      steps: { ...this.state.steps, ...(update.steps ?? {}) },
      requestedIntegrations: update.requestedIntegrations ?? this.state.requestedIntegrations,
    };
    if (!this.state.startedAt) this.state.startedAt = new Date().toISOString();
    this.db.save(this.state);
    return this.state;
  }

  complete(update: Partial<OnboardingStatus>): OnboardingStatus {
    this.state = {
      ...this.state,
      ...update,
      completed: true,
      completedAt: new Date().toISOString(),
      startedAt: this.state.startedAt ?? new Date().toISOString(),
      steps: { ...this.state.steps, ...(update.steps ?? {}) },
      requestedIntegrations: update.requestedIntegrations ?? this.state.requestedIntegrations,
    };
    this.db.save(this.state);
    return this.state;
  }

  reset(): OnboardingStatus {
    this.state = { ...EMPTY, steps: { ...EMPTY.steps } };
    this.db.save(this.state);
    return this.state;
  }
}
