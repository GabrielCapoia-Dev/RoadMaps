import { fileURLToPath } from 'node:url';

export interface Environment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  HOST: string;
  SWAGGER_ENABLED: boolean;
  TRUST_PROXY: boolean;
  DATABASE_URL: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  MAIL_FROM: string;
}

// Paths stay stable when executed from src/config or compiled dist/config.
// Process environment wins, followed by repository .env, then API/.env.
export const envFilePaths = [
  fileURLToPath(new URL('../../../.env', import.meta.url)),
  fileURLToPath(new URL('../../.env', import.meta.url)),
];

export function validateEnvironment(input: Record<string, unknown>): Environment {
  const nodeEnv = input.NODE_ENV ?? 'development';
  if (nodeEnv !== 'development' && nodeEnv !== 'test' && nodeEnv !== 'production') {
    throw new Error('NODE_ENV must be development, test or production.');
  }

  const rawPort = input.PORT ?? '3000';
  if (
    (typeof rawPort !== 'string' && typeof rawPort !== 'number') ||
    !/^\d+$/.test(String(rawPort))
  ) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const host = input.HOST ?? '0.0.0.0';
  if (typeof host !== 'string' || !host.trim() || /\s/.test(host)) {
    throw new Error('HOST must be a nonempty hostname or IP address.');
  }

  const rawSwagger = input.SWAGGER_ENABLED;
  if (
    rawSwagger !== undefined &&
    rawSwagger !== true &&
    rawSwagger !== false &&
    rawSwagger !== 'true' &&
    rawSwagger !== 'false'
  ) {
    throw new Error('SWAGGER_ENABLED must be true or false.');
  }

  const databaseUrl =
    input.DATABASE_URL ?? 'postgresql://breadcrumbs:breadcrumbs_local@localhost:5432/breadcrumbs';
  const rawTrustProxy = input.TRUST_PROXY ?? false;
  if (![true, false, 'true', 'false'].includes(rawTrustProxy as string | boolean))
    throw new Error('TRUST_PROXY must be true or false.');
  if (typeof databaseUrl !== 'string') throw new Error('DATABASE_URL must be a PostgreSQL URL.');
  try {
    const parsed = new URL(databaseUrl);
    if (
      !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
      !parsed.hostname ||
      !parsed.pathname.slice(1)
    )
      throw new Error();
  } catch {
    throw new Error('DATABASE_URL must be a PostgreSQL URL.');
  }
  const smtpHost = input.SMTP_HOST ?? 'localhost';
  if (typeof smtpHost !== 'string' || !smtpHost || /\s/.test(smtpHost))
    throw new Error('SMTP_HOST must be a hostname.');
  const smtpPort = Number(input.SMTP_PORT ?? '1025');
  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535)
    throw new Error('SMTP_PORT must be a valid port.');
  const rawSecure = input.SMTP_SECURE ?? 'false';
  if (![true, false, 'true', 'false'].includes(rawSecure as string | boolean))
    throw new Error('SMTP_SECURE must be true or false.');
  const mailFrom = input.MAIL_FROM ?? 'BreadCrumbs <no-reply@breadcrumbs.local>';
  if (typeof mailFrom !== 'string' || !mailFrom.includes('@') || /[\r\n]/.test(mailFrom))
    throw new Error('MAIL_FROM must be an email sender.');
  if (
    nodeEnv === 'production' &&
    (!input.DATABASE_URL ||
      databaseUrl.includes('breadcrumbs_local') ||
      !input.SMTP_HOST ||
      !input.MAIL_FROM)
  )
    throw new Error(
      'Production requires explicit DATABASE_URL, SMTP_HOST and MAIL_FROM, without development database credentials.',
    );
  if ((input.SMTP_USER && !input.SMTP_PASSWORD) || (!input.SMTP_USER && input.SMTP_PASSWORD))
    throw new Error('SMTP_USER and SMTP_PASSWORD must be configured together.');
  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    HOST: host,
    DATABASE_URL: databaseUrl,
    TRUST_PROXY: rawTrustProxy === true || rawTrustProxy === 'true',
    SMTP_HOST: smtpHost,
    SMTP_PORT: smtpPort,
    SMTP_SECURE: rawSecure === true || rawSecure === 'true',
    SMTP_USER: typeof input.SMTP_USER === 'string' ? input.SMTP_USER : undefined,
    SMTP_PASSWORD: typeof input.SMTP_PASSWORD === 'string' ? input.SMTP_PASSWORD : undefined,
    MAIL_FROM: mailFrom,
    SWAGGER_ENABLED:
      rawSwagger === undefined
        ? nodeEnv !== 'production'
        : rawSwagger === true || rawSwagger === 'true',
  };
}
