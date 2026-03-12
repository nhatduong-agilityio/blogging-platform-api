import jwt from 'jsonwebtoken';

// Constants
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES
} from '../constants/jwt.js';

// Types
import type { JwtPayload } from '../types/auth.js';

/**
 * Generates an access token for the given payload.
 * The token is signed with the JWT_ACCESS_SECRET and expires after ACCESS_TOKEN_EXPIRES.
 * @param {JwtPayload} payload - The payload to be signed.
 * @returns {string} - The generated access token.
 */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES
  });
}

/**
 * Generates a refresh token for the given payload.
 * The token is signed with the JWT_REFRESH_SECRET and expires after REFRESH_TOKEN_EXPIRES.
 * @param {JwtPayload} payload - The payload to be signed.
 * @returns {string} - The generated refresh token.
 */
export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES
  });
}

/**
 * Verifies an access token by decoding it with the JWT_ACCESS_SECRET.
 * @param {string} token - The access token to be verified.
 * @returns {JwtPayload} - The decoded payload if the token is valid, otherwise throws an error.
 * @throws {JwtVerifyError} - If the token is invalid or expired.
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
}

/**
 * Verifies a refresh token by decoding it with the JWT_REFRESH_SECRET.
 * @param {string} token - The refresh token to be verified.
 * @returns {JwtPayload} - The decoded payload if the token is valid, otherwise throws a JwtVerifyError.
 * @throws {JwtVerifyError} - If the token is invalid or expired.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
}
