import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('idempotency_keys')
export class IdempotencyKeyEntity {
  @PrimaryColumn({ type: 'text' })
  key!: string;

  @Column({ name: 'status_code', type: 'integer' })
  statusCode!: number;

  @Column({ type: 'text' })
  response!: string; // JSON-serialised response body

  @Column({ name: 'created_at', type: 'integer' })
  createdAt!: number; // Unix ms timestamp
}
