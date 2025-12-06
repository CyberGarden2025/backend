import * as Sentry from '@sentry/nestjs';

const dsn =
    process.env.SENTRY_DSN ||
    'https://df9fab96c5568b05246ad3920b77cb5f@sentry.k-lab.su/2';

const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '1.0');

Sentry.init({
    dsn,
    tracesSampleRate: Number.isNaN(tracesSampleRate) ? 1.0 : tracesSampleRate,
    sendDefaultPii: true,
    environment: process.env.SENTRY_ENVIRONMENT,
    release: process.env.SENTRY_RELEASE || process.env.npm_package_version,
    debug: process.env.SENTRY_DEBUG === 'true',
});
