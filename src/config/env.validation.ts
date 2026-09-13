import * as Joi from 'joi';

// Shared environment validation
const nodeEnvSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production').required(),
}).unknown(true);

// Database validation
const dbSchema = (suffix = '') =>
  Joi.object({
    [`DB_HOST${suffix}`]: Joi.string().required(),
    [`DB_PORT${suffix}`]: Joi.number().port().required(),
    [`DB_USERNAME${suffix}`]: Joi.string().required(),
    [`DB_PASSWORD${suffix}`]: Joi.string().required(),
    [`DB_NAME${suffix}`]: Joi.string().required(),
  }).unknown(true);

const dbValidationSchema = nodeEnvSchema
  .when(Joi.object({ NODE_ENV: 'development' }).unknown(true), {
    then: dbSchema('_DEV'),
  })
  .when(Joi.object({ NODE_ENV: 'production' }).unknown(true), {
    then: dbSchema(),
  });

// JWT validation
const jwtValidationSchema = Joi.object({
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().default(900),
  JWT_REFRESH_TOKEN_TTL: Joi.number().default(604800),
  JWT_ISSUER: Joi.string().default('workout-api'),
  JWT_AUDIENCE: Joi.string().default('workout-app'),
}).unknown(true);

// Password hashing validation
const hashingValidationSchema = Joi.object({
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(8).max(15).default(10),
}).unknown(true);

// Redis validation
const redisValidationSchema = Joi.object({
  REDIS_HOST: Joi.string().default('127.0.0.1'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().integer().min(0).max(15).default(0),
}).unknown(true);

// Seed-only validation
const seedValidationSchema = Joi.object({
  SEED_USER_PASSWORD: Joi.string().min(8).required(),
}).unknown(true);

function combineValidationSchemas(
  schemas: Joi.ObjectSchema[],
): Joi.ObjectSchema {
  return schemas
    .reduce(
      (combinedSchema, schema) => combinedSchema.concat(schema),
      Joi.object(),
    )
    .unknown(true);
}

// Main API environment
export const appEnvValidationSchema = combineValidationSchemas([
  dbValidationSchema,
  jwtValidationSchema,
  hashingValidationSchema,
  redisValidationSchema,
]);

// Seed command environment
export const seedEnvValidationSchema = combineValidationSchemas([
  dbValidationSchema,
  hashingValidationSchema,
  seedValidationSchema,
]);

// Import command environment
export const importEnvValidationSchema = combineValidationSchemas([
  dbValidationSchema,
]);
