import { Worker } from 'bullmq';
import * as Sentry from '@sentry/node';
import {
  workerConnectionOptions,
  WELCOME_EMAIL_QUEUE,
} from '../jobs/queues.js';
import { process as processWelcomeEmail } from '../jobs/send-welcome-email.job.js';

export function startEmailWorkers() {
  const welcomeWorker = new Worker(WELCOME_EMAIL_QUEUE, processWelcomeEmail, {
    connection: workerConnectionOptions,
    concurrency: 5,
    lockDuration: 30000,
  });

  const workers = [welcomeWorker];

  for (const worker of workers) {
    worker.on('failed', (job, err) => {
      Sentry.captureException(err, {
        extra: { jobId: job?.id, jobName: job?.name },
      });
    });
    worker.on('error', (err) => {
      Sentry.captureException(err, {
        extra: { workerName: worker.name },
      });
    });
  }

  return workers;
}
