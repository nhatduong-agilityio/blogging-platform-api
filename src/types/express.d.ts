// src/types/express.d.ts
//
// Augments Express's Request type globally so req.user is typed
// as JwtPayload throughout the entire app — no more casting inline.

import type { JwtPayload, UserRole } from './auth.js';

declare global {
  namespace Express {
    interface User extends JwtPayload {
      userId: number;
      email: string;
      role: UserRole;
    }
  }
}

// Required to make this file a module (not a script)
export {};
