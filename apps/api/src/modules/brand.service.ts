import { Inject, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import type {
  BrandMemoryVersion,
  BrandProfile,
  BrandProfileSource,
} from "@geoseo/types";
import { BRAND_SOURCE } from "../seo/seo.module";
import { DocStore } from "../db/db";

type BrandState = { versions: BrandMemoryVersion[]; seq: number };

/**
 * In-memory versioned Brand Memory. Seeds v1 from the bound BrandProfileSource
 * (mock today), then keeps an append-only version history on each update/revert.
 * Swap for a pgvector-backed store (the brand-memory product) behind the same
 * shape later — controllers don't change.
 */
@Injectable()
export class BrandMemoryStore implements OnModuleInit {
  private versions: BrandMemoryVersion[] = [];
  private seq = 0;
  // Deterministic clock: the mock data is anchored to this date.
  private now = "2026-06-12T00:00:00.000Z";
  private db = new DocStore<BrandState>("cx_brand");

  constructor(@Inject(BRAND_SOURCE) private readonly source: BrandProfileSource) {}

  async onModuleInit() {
    const seed = await this.source.getBrandProfile();
    this.commit(seed, "Onboarding", "Initial brand capture from website + onboarding form");
    await this.db.init({ versions: this.versions, seq: this.seq }, (loaded) => {
      this.versions = loaded.versions;
      this.seq = loaded.seq;
    });
  }

  private commit(profile: BrandProfile, author: string, note: string): BrandMemoryVersion {
    this.seq += 1;
    const version: BrandMemoryVersion = {
      id: `bmv-${this.seq}`,
      version: this.seq,
      profile,
      updatedAt: this.now,
      author,
      note,
    };
    this.versions.unshift(version); // newest first
    this.db.save({ versions: this.versions, seq: this.seq });
    return version;
  }

  current(): BrandProfile {
    return this.versions[0].profile;
  }

  getBrandProfile() {
    return Promise.resolve(this.current());
  }

  getVersions() {
    return Promise.resolve(this.versions);
  }

  update(profile: BrandProfile, note = "Manual edit") {
    return Promise.resolve(this.commit(profile, "You", note));
  }

  revert(versionId: string) {
    const target = this.versions.find((v) => v.id === versionId);
    if (!target) throw new NotFoundException(`Version ${versionId} not found`);
    return Promise.resolve(
      this.commit(target.profile, "You", `Reverted to v${target.version}`),
    );
  }
}
