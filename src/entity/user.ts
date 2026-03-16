import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserRole } from '../types/auth.js';
import { ROLE } from '../constants/user.js';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ type: 'text' })
  password!: string;

  // Default role is 'user' — assign 'admin' manually in DB or via
  @Column({ type: 'text', default: ROLE.USER })
  role!: UserRole;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken!: string | null;
}
