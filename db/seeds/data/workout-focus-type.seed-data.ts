import { WorkoutFocusType } from 'db/entities/workout/workout/workout-focus-types.entity';
import { SEED_ACTOR } from '../types/seed.types';

type WorkoutFocusTypeSeedData = Pick<
  WorkoutFocusType,
  'code' | 'name' | 'created_by' | 'updated_by'
>;

export const WORKOUT_FOCUS_TYPE_SEED_DATA = [
  {
    code: 'strength',
    name: 'Strength Training',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'hypertrophy',
    name: 'Muscle Building',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'cardio',
    name: 'Cardio',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'hiit',
    name: 'HIIT',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'endurance',
    name: 'Endurance',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'calisthenics',
    name: 'Calisthenics',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'mobility',
    name: 'Mobility',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'conditioning',
    name: 'Conditioning',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
] satisfies WorkoutFocusTypeSeedData[];
