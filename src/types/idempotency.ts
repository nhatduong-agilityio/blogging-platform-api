export interface IdempotencyRow {
  key: string;
  status_code: number;
  response: string; // serialised JSON
  created_at: number; // Unix ms
}
