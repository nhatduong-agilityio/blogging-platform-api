import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

// Constants
import { JWT_ACCESS_SECRET } from '../constants/jwt.js';

// Types
import type { VerifiedCallback } from 'passport-jwt';
import type { JwtPayload } from '../types/auth.js';
import type { UserRepository } from '../repositories/user.js';

/**
 * Configures Passport to use JWT strategy for authentication.
 *
 * Extracts the Bearer token from the Authorization header, verifies it against JWT_ACCESS_SECRET,
 * then loads the user from the DB to ensure the account still exists.
 *
 * On success  → req.user is set to JwtPayload { userId, email }
 * On failure  → 401 Unauthorized (handled by authMiddleware)
 *
 * @param userRepo - The UserRepository instance to use for loading users.
 */
export function configurePassport(userRepo: UserRepository): void {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_ACCESS_SECRET
      },
      (payload: JwtPayload, done: VerifiedCallback): void => {
        userRepo
          .findByIdWithSensitiveData(payload.userId)
          .then(user => {
            if (!user) {
              return done(new Error('User not found'), false);
            }

            // Include role from DB — DB is source of truth.
            // If an admin is demoted, the next login will issue a token
            // with the updated role. Existing tokens expire in 15 min.
            done(null, {
              userId: user.id,
              email: user.email,
              role: user.role
            } satisfies JwtPayload);
          })
          .catch(err => {
            done(err instanceof Error ? err : new Error(String(err)), false);
          });
      }
    )
  );
}
