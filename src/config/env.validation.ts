import * as Joi from 'joi';

// DB validation
const dbSchema = (suffix = '') =>
  Joi.object({
    [`DB_HOST${suffix}`]: Joi.string().required(),
    [`DB_PORT${suffix}`]: Joi.number().required(),
    [`DB_USERNAME${suffix}`]: Joi.string().required(),
    [`DB_PASSWORD${suffix}`]: Joi.string().required(),
    [`DB_NAME${suffix}`]: Joi.string().required(),
  }).unknown(true);

export const dbValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production').required(),
})
  .when(Joi.object({ NODE_ENV: 'development' }).unknown(true), {
    then: dbSchema('_DEV'),
  })
  .when(Joi.object({ NODE_ENV: 'production' }).unknown(true), {
    then: dbSchema(),
  });

// JWT validation
export const jwtValidationSchema = Joi.object({
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().default(900),
  JWT_REFRESH_TOKEN_TTL: Joi.number().default(604800),
  JWT_ISSUER: Joi.string().default('workout-api'),
  JWT_AUDIENCE: Joi.string().default('workout-app'),

  BCRYPT_SALT_ROUNDS: Joi.number().min(8).max(15).default(10),
}).unknown(true);

// Merge schemas
const schemas = [dbValidationSchema, jwtValidationSchema];

export const envValidationSchema = schemas.reduce(
  (acc, schema) => acc.concat(schema),
  Joi.object(),
);

envValidationSchema.unknown(true);
