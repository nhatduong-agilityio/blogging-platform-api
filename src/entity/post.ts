import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

// Post Entity
// TypeORM maps this class directly to the `posts` table.
// Replaces: Post interface + PostRow interface + mapRow()

@Entity('posts')
export class PostEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text' })
  category!: string;

  // SQLite has no native array type — stored as JSON string,
  // transformer handles serialise/deserialise automatically.
  @Column({
    type: 'text',
    default: '[]',
    transformer: {
      /**
       * Transforms a given value into a JSON string
       * @param {unknown} value - The value to transform
       * @returns {string} The JSON string representation of the given value
       * If the value is an array, it will be stringified using JSON.stringify
       * If the value is a string, it will be returned as-is
       * Otherwise, an empty array '[]' will be returned
       */
      to: (value: unknown): string => {
        if (Array.isArray(value)) return JSON.stringify(value);
        return '[]';
      },
      /**
       * Reverses the JSON stringification process from the `to` transformer.
       * @param {unknown} value - The value to reverse-transform
       * @returns {string[]} The reversed-transformed value
       * If the value is an array, it will be returned as-is
       * If the value is a string, it will be parsed from JSON if it starts with '['
       * Otherwise, an empty array '[]' will be returned
       */
      from: (value: unknown): string[] => {
        if (Array.isArray(value)) return value as string[];
        if (typeof value !== 'string' || !value) return [];
        const trimmed = value.trim();
        if (trimmed.startsWith('[')) return JSON.parse(trimmed) as string[];
        return trimmed
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
      }
    }
  })
  tags!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
