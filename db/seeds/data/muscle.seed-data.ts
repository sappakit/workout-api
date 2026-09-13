import { Muscle } from 'db/entities/workout/shared/muscles.entity';
import { SEED_ACTOR } from '../types/seed.types';

type MuscleSeedData = Pick<
  Muscle,
  'code' | 'name' | 'created_by' | 'updated_by'
>;

export const MUSCLE_SEED_DATA = [
  {
    code: 'abdominals',
    name: 'Abdominals',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'abductors',
    name: 'Hip Abductors',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'adductors',
    name: 'Hip Adductors',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'biceps',
    name: 'Biceps',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'calves',
    name: 'Calves',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'chest',
    name: 'Chest',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'forearms',
    name: 'Forearms',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'glutes',
    name: 'Glutes',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'hamstrings',
    name: 'Hamstrings',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'lats',
    name: 'Lats',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'lower-back',
    name: 'Lower Back',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'middle-back',
    name: 'Middle Back',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'neck',
    name: 'Neck',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'quadriceps',
    name: 'Quadriceps',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'shoulders',
    name: 'Shoulders',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'traps',
    name: 'Traps',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'triceps',
    name: 'Triceps',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
] satisfies MuscleSeedData[];
