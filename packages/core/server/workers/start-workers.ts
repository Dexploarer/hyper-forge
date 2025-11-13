/**
 * Worker Pool Starter
 * Starts multiple generation workers for concurrent job processing
 */

import { GenerationWorker } from "./generation-worker";
import { logger } from '../utils/logger';

const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "3", 10);

logger.info({ context: 'WorkerPool' }, 'Starting ${WORKER_CONCURRENCY} workers...');

const workers: GenerationWorker[] = [];

// Start workers
for (let i = 0; i < WORKER_CONCURRENCY; i++) {
  const workerId = `worker-${i + 1}`;
  const worker = new GenerationWorker(workerId);
  workers.push(worker);

  // Start worker in background
  worker.start().catch((error) => {
    logger.error({, error }, '[WorkerPool] Worker ${workerId} crashed:');
    // TODO: Implement automatic restart logic
  });
}

// Graceful shutdown
const shutdown = () => {
  logger.info({ }, '[WorkerPool] Shutting down workers...');
  workers.forEach((worker) => worker.stop());

  // Give workers time to finish current jobs
  setTimeout(() => {
    logger.info({ }, '[WorkerPool] Shutdown complete');
    process.exit(0);
  }, 5000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

logger.info({ context: 'WorkerPool' }, '${WORKER_CONCURRENCY} workers started and ready');
