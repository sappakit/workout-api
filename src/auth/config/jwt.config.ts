import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET!,
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
  accessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL ?? '900', 10), // 15 min
  refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL ?? '604800', 10), // 7 days
  issuer: process.env.JWT_ISSUER ?? 'workout-api',
  audience: process.env.JWT_AUDIENCE ?? 'workout-app',
}));
