export const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'access_secret';

export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'refresh_secret';

export const ACCESS_TOKEN_EXPIRES = '15m';
export const REFRESH_TOKEN_EXPIRES = '7d';
