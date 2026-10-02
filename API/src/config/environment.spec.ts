import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './environment.js';

describe('environment validation', () => {
  it('provides development defaults and typed values', () => {
    expect(validateEnvironment({})).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '0.0.0.0',
      SWAGGER_ENABLED: true,
    });
    expect(validateEnvironment({ PORT: '4321', SWAGGER_ENABLED: 'false' })).toMatchObject({
      PORT: 4321,
      SWAGGER_ENABLED: false,
    });
  });

  it('disables public docs by default in production, with an explicit override', () => {
    const production = {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://app:unique-password@db:5432/app',
      SMTP_HOST: 'smtp.example.com',
      MAIL_FROM: 'app@example.com',
    };
    expect(validateEnvironment(production).SWAGGER_ENABLED).toBe(false);
    expect(validateEnvironment({ ...production, SWAGGER_ENABLED: 'true' }).SWAGGER_ENABLED).toBe(
      true,
    );
  });

  it('rejects invalid database/SMTP configuration and development production credentials', () => {
    expect(() => validateEnvironment({ DATABASE_URL: 'https://example.com' })).toThrow(
      'DATABASE_URL',
    );
    expect(() => validateEnvironment({ SMTP_PORT: 0 })).toThrow('SMTP_PORT');
    expect(() => validateEnvironment({ SMTP_SECURE: 'yes' })).toThrow('SMTP_SECURE');
    expect(() => validateEnvironment({ SMTP_USER: 'user' })).toThrow('SMTP_USER');
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow('Production');
  });

  it.each(['', '0', '65536', '-1', '3.14', '3000abc', '1e3', ' 3000 ', true])(
    'rejects invalid PORT %s',
    (PORT) => {
      expect(() => validateEnvironment({ PORT })).toThrow('PORT');
    },
  );

  it.each(['', 'yes', '0', 'TRUE', 0, null])(
    'rejects ambiguous SWAGGER_ENABLED %s',
    (SWAGGER_ENABLED) => {
      expect(() => validateEnvironment({ SWAGGER_ENABLED })).toThrow('SWAGGER_ENABLED');
    },
  );

  it('rejects unsupported runtime mode and invalid host', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'prod' })).toThrow('NODE_ENV');
    expect(() => validateEnvironment({ HOST: '' })).toThrow('HOST');
    expect(() => validateEnvironment({ HOST: 'localhost extra' })).toThrow('HOST');
  });
});
