import { ExerciseCategory } from 'db/entities/workout';
import { SEED_ACTOR } from '../types/seed.types';

type ExerciseCategorySeedData = Pick<
  ExerciseCategory,
  | 'code'
  | 'name'
  | 'description'
  | 'display_order'
  | 'is_active'
  | 'created_by'
  | 'updated_by'
>;

export const EXERCISE_CATEGORY_SEED_DATA = [
  {
    code: 'cardio',
    name: 'Cardio',
    description:
      'Exercises focused on cardiovascular endurance and conditioning.',
    display_order: 1,
    is_active: true,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'olympic-weightlifting',
    name: 'Olympic Weightlifting',
    description: 'Olympic lifting movements and related training exercises.',
    display_order: 2,
    is_active: true,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'plyometrics',
    name: 'Plyometrics',
    description:
      'Explosive exercises focused on speed, power, and jumping ability.',
    display_order: 3,
    is_active: true,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'powerlifting',
    name: 'Powerlifting',
    description: 'Exercises commonly used in powerlifting training.',
    display_order: 4,
    is_active: true,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'strength',
    name: 'Strength',
    description: 'General resistance and strength-training exercises.',
    display_order: 5,
    is_active: true,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'stretching',
    name: 'Stretching',
    description:
      'Exercises focused on flexibility, mobility, and range of motion.',
    display_order: 6,
    is_active: true,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'strongman',
    name: 'Strongman',
    description: 'Strongman-style strength and conditioning exercises.',
    display_order: 7,
    is_active: true,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
] satisfies ExerciseCategorySeedData[];
