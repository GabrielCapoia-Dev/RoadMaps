import { Global, Inject, Injectable, Logger, Module, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, type PoolClient, type QueryResultRow } from 'pg';

export type Transaction = PoolClient;

@Injectable()
export class Database implements OnModuleDestroy {
  private readonly pool: Pool;
  private closing?: Promise<void>;
  constructor(@Inject(ConfigService) config: ConfigService) {
    this.pool = new Pool({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
      max: 10,
      connectionTimeoutMillis: 5000,
      statement_timeout: 10000,
      idle_in_transaction_session_timeout: 15000,
    });
    this.pool.on('error', () => new Logger(Database.name).error('Idle database connection failed'));
  }
  async query<T extends QueryResultRow>(
    sql: string,
    values: unknown[] = [],
    tx?: Transaction,
  ): Promise<T[]> {
    return (await (tx ?? this.pool).query<T>(sql, values)).rows;
  }
  async transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    const tx = await this.pool.connect();
    try {
      await tx.query('BEGIN');
      const result = await work(tx);
      await tx.query('COMMIT');
      return result;
    } catch (error) {
      await tx.query('ROLLBACK');
      throw error;
    } finally {
      tx.release();
    }
  }
  async ready(): Promise<void> {
    await this.query('SELECT name FROM schema_migrations LIMIT 1');
  }
  async onModuleDestroy(): Promise<void> {
    this.closing ??= this.pool.end();
    await this.closing;
  }
}

@Global()
@Module({ providers: [Database], exports: [Database] })
export class DatabaseModule {}
