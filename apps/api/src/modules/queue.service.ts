import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { resolveMode } from "../common/mode";
import { queuePolicy } from "./queue-policy";

const QUEUE_NAME = "geoseo-jobs";

/**
 * Real durable job queue on Redis (BullMQ). Activates only when REDIS_URL is set
 * AND the connection succeeds — otherwise `active` stays false and callers fall
 * back to the in-memory simulation. So a missing/broken Redis can never break
 * the job system. The processor is supplied by JobsStore via `start()` (avoids a
 * circular dependency — the queue never imports JobsStore).
 */
@Injectable()
export class JobQueue implements OnModuleDestroy {
  private readonly logger = new Logger("queue");
  private connection: Redis | null = null;
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private workerErrors = 0;
  private tripped = false;
  active = false;

  private get policy() {
    return queuePolicy({
      mode: resolveMode(),
      allowInMemory: process.env.ALLOW_INMEMORY_QUEUE === "true",
    });
  }

  get durableRequired(): boolean {
    return this.policy.durableRequired;
  }

  get simulationAllowed(): boolean {
    return this.policy.simulationAllowed;
  }

  /** Circuit-breaker: a persistently-broken Redis (e.g. Upstash over its request quota)
   *  makes the worker re-emit "error" on every poll. Trip after a few errors → tear the
   *  worker/queue down and fall back to in-memory, instead of flooding the log and burning
   *  more requests against a dead Redis. */
  private tripBreaker(): void {
    if (this.tripped) return;
    this.tripped = true;
    this.active = false;
    this.logger.error(
      "Redis queue disabled after repeated errors — falling back to in-memory jobs. " +
        "Set ALLOW_INMEMORY_QUEUE=true (or fix REDIS_URL) to silence this.",
    );
    void this.worker?.close().catch(() => {});
    void this.queue?.close().catch(() => {});
    void this.connection?.quit().catch(() => {});
    this.worker = null;
    this.queue = null;
  }

  async start(handler: (jobRunId: string) => Promise<void>): Promise<void> {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.log("REDIS_URL unset — jobs run in-memory");
      return;
    }
    // Kill-switch: ALLOW_INMEMORY_QUEUE=true skips Redis entirely (no connection, no
    // polling worker) — jobs run in-memory. Use this on metered/free Redis (e.g. Upstash
    // free tier) to avoid the worker's blocking-poll loop burning the request quota. It is
    // the same flag the fail-closed boot gate accepts, so the API still boots in production.
    if (process.env.ALLOW_INMEMORY_QUEUE === "true") {
      this.logger.warn("ALLOW_INMEMORY_QUEUE=true — Redis queue disabled, jobs run in-memory (no Redis traffic)");
      return;
    }
    try {
      // BullMQ requires maxRetriesPerRequest: null; rediss:// auto-enables TLS.
      this.connection = new Redis(url, { maxRetriesPerRequest: null });
      // ioredis connects lazily; do not advertise durability until a real command succeeds.
      await this.connection.ping();
      this.queue = new Queue(QUEUE_NAME, { connection: this.connection });
      this.worker = new Worker(
        QUEUE_NAME,
        async (job) => {
          await handler(job.data.jobRunId as string);
        },
        {
          connection: this.connection,
          // Minimize Redis request volume on metered providers (Upstash bills per request):
          // long block-poll (fewer idle bzpopmin cycles), infrequent stalled checks, single
          // concurrency, and aggressive auto-removal so completed/failed sets stay tiny.
          concurrency: 1,
          drainDelay: 60, // seconds to block waiting for a job (default 5 → 12×/min idle)
          stalledInterval: 300_000, // check stalled jobs every 5 min (default 30s)
          maxStalledCount: 1,
          removeOnComplete: { count: 20 },
          removeOnFail: { count: 50 },
        },
      );
      this.worker.on("failed", (job, err) =>
        this.logger.error(`job ${job?.id} failed: ${err.message}`),
      );
      // CRITICAL: BullMQ's Worker/Queue are EventEmitters that emit "error" for internal
      // failures (e.g. the blocking-poll connection, or Upstash replying "max requests limit
      // exceeded"). An "error" event with NO listener throws and crashes the whole process —
      // which is exactly how a metered/over-quota Redis took the API down. Listen so a broken
      // Redis only logs + degrades to the in-memory path, never crashes (per this file's contract).
      this.worker.on("error", (e) => {
        this.workerErrors += 1;
        if (this.workerErrors <= 3) this.logger.error(`worker: ${e.message}`);
        if (this.workerErrors >= 5) this.tripBreaker();
      });
      this.queue.on("error", (e) => this.logger.error(`queue: ${e.message}`));
      // Surface connection errors without crashing the API.
      this.connection.on("error", (e) => this.logger.error(`redis: ${e.message}`));
      this.active = true;
      this.logger.log("BullMQ active on Redis — jobs are durable");
    } catch (e) {
      this.logger.error(`init failed: ${(e as Error).message}`);
      this.active = false;
      await this.connection?.quit().catch(() => {});
      this.connection = null;
      this.queue = null;
      this.worker = null;
      if (this.durableRequired) {
        throw new Error(`Durable Redis queue unavailable: ${(e as Error).message}`);
      }
      this.logger.warn("Using the explicitly allowed in-memory job simulation.");
    }
  }

  async enqueue(jobRunId: string, type: string): Promise<void> {
    if (!this.queue) return;
    await this.queue.add(
      type,
      { jobRunId },
      { attempts: 2, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: 20, removeOnFail: 50 },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close().catch(() => {});
    await this.queue?.close().catch(() => {});
    await this.connection?.quit().catch(() => {});
  }
}
