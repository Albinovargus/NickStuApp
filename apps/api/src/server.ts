import { build } from './app.js';

const port = Number(process.env['PORT'] ?? 3000);
const host = '0.0.0.0';

async function start() {
  const app = await build();

  const signals = ['SIGTERM', 'SIGINT'] as const;
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down...`);
      await app.close();
      process.exit(0);
    });
  }

  try {
    const address = await app.listen({ port, host });
    app.log.info(`Server listening at ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
