import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";

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
  active = false;

  async start(handler: (jobRunId: string) => Promise<void>): Promise<void> {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.log("REDIS_URL unset — jobs run in-memory");
      return;
    }
    try {
      // BullMQ requires maxRetriesPerRequest: null; rediss:// auto-enables TLS.
      this.connection = new Redis(url, { maxRetriesPerRequest: null });
      this.queue = new Queue(QUEUE_NAME, { connection: this.connection });
      this.worker = new Worker(
        QUEUE_NAME,
        async (job) => {
          await handler(job.data.jobRunId as string);
        },
        { connection: this.connection },
      );
      this.worker.on("failed", (job, err) =>
        this.logger.error(`job ${job?.id} failed: ${err.message}`),
      );
      // Surface connection errors without crashing the API.
      this.connection.on("error", (e) => this.logger.error(`redis: ${e.message}`));
      this.active = true;
      this.logger.log("BullMQ active on Redis — jobs are durable");
    } catch (e) {
      this.logger.error(`init failed, in-memory fallback: ${(e as Error).message}`);
      this.active = false;
    }
  }

  async enqueue(jobRunId: string, type: string): Promise<void> {
    if (!this.queue) return;
    await this.queue.add(
      type,
      { jobRunId },
      { attempts: 2, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: 200, removeOnFail: 100 },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close().catch(() => {});
    await this.queue?.close().catch(() => {});
    await this.connection?.quit().catch(() => {});
  }
}
