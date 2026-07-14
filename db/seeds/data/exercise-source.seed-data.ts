import { ExerciseSource } from 'db/entities/workout';

export type ExerciseSourceSeedData = Pick<
  ExerciseSource,
  | 'key'
  | 'name'
  | 'source_url'
  | 'license_name'
  | 'license_url'
  | 'attribution_text'
  | 'source_version'
  | 'source_commit_hash'
  | 'imported_at'
  | 'created_by'
  | 'updated_by'
>;

export const EXERCISE_SOURCE_SEED_DATA = [
  {
    key: 'free-exercise-db',
    name: 'Free Exercise DB',
    source_url: 'https://github.com/yuhonas/free-exercise-db',
    license_name: 'The Unlicense',
    license_url:
      'https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE',
    attribution_text: 'Exercise data and media sourced from Free Exercise DB.',
    source_version: null,
    source_commit_hash: null,
    imported_at: null,
    created_by: 'exercise-source-seed',
    updated_by: 'exercise-source-seed',
  },
] satisfies ExerciseSourceSeedData[];
