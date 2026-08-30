import { ExerciseTrackingType } from 'db/entities/workout/exercise/exercise-tracking-type.entity';
import { SEED_ACTOR } from '../types/seed.types';

type ExerciseTrackingTypeSeedData = Pick<
  ExerciseTrackingType,
  'code' | 'name' | 'description' | 'created_by' | 'updated_by'
>;

export const EXERCISE_TRACKING_TYPE_SEED_DATA = [
  {
    code: 'weight_reps',
    name: 'Weight & Reps',
    description: 'Track weight and repetitions for each set.',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'reps',
    name: 'Reps',
    description: 'Track repetitions for each set.',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'duration',
    name: 'Duration',
    description: 'Track duration for each set.',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'distance_duration',
    name: 'Distance & Duration',
    description: 'Track distance and duration for each set.',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'weighted_bodyweight',
    name: 'Weighted Bodyweight',
    description:
      'Track additional weight and repetitions for bodyweight exercises.',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'assisted_bodyweight',
    name: 'Assisted Bodyweight',
    description:
      'Track assistance weight and repetitions for assisted bodyweight exercises.',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'weight_distance',
    name: 'Weight & Distance',
    description: 'Track weight and distance for each set.',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'weight_duration',
    name: 'Weight & Duration',
    description: 'Track weight and duration for each set.',
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
] satisfies ExerciseTrackingTypeSeedData[];
