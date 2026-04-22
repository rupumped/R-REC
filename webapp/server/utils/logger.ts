import pino from 'pino'

export const logger = pino(
  { level: 'info' },
  process.env.AXIOM_DATASET && process.env.AXIOM_TOKEN
    ? pino.transport({
        target: '@axiomhq/pino',
        options: {
          dataset: process.env.AXIOM_DATASET,
          token: process.env.AXIOM_TOKEN,
        },
      })
    : undefined,
)