import { Workout } from 'db/entities/workout/workout/workouts.entity';
import { ContentStatus, WorkoutPlanType } from 'src/workout/enums/workout.enum';
import { SEED_ACTOR } from '../types/seed.types';

export type WorkoutExerciseSeedData = {
  sourceKey: string;
  sourceExternalId: string;
  orderIndex: number;
  restTime: number | null;
};

export type WorkoutSeedData = Pick<
  Workout,
  | 'name'
  | 'image_url'
  | 'description'
  | 'duration'
  | 'plan_type'
  | 'status'
  | 'created_by'
  | 'updated_by'
> & {
  code: string;
  workoutFocusTypeCode: string | null;
  exercises: WorkoutExerciseSeedData[];
};

const FREE_EXERCISE_DB_SOURCE = 'free-exercise-db';

export const WORKOUT_SEED_DATA = [
  {
    code: 'push-day',

    name: 'Push Day',
    image_url: null,
    description: 'Chest, shoulders, and triceps focused workout.',
    duration: 3600,

    plan_type: WorkoutPlanType.TEMPLATE,
    status: ContentStatus.ACTIVE,

    workoutFocusTypeCode: 'hypertrophy',

    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,

    exercises: [
      {
        sourceKey: FREE_EXERCISE_DB_SOURCE,
        sourceExternalId: 'Barbell_Bench_Press_-_Medium_Grip',
        orderIndex: 0,
        restTime: 180,
      },
      {
        sourceKey: FREE_EXERCISE_DB_SOURCE,
        sourceExternalId: 'Incline_Dumbbell_Press',
        orderIndex: 1,
        restTime: 150,
      },
      {
        sourceKey: FREE_EXERCISE_DB_SOURCE,
        sourceExternalId: 'Dumbbell_Shoulder_Press',
        orderIndex: 2,
        restTime: 120,
      },
      {
        sourceKey: FREE_EXERCISE_DB_SOURCE,
        sourceExternalId: 'Triceps_Pushdown',
        orderIndex: 3,
        restTime: 90,
      },
    ],
  },
  {
    code: 'pull-day',

    name: 'Pull Day',
    image_url: null,
    description: 'Back and biceps focused workout.',
    duration: 3600,

    plan_type: WorkoutPlanType.TEMPLATE,
    status: ContentStatus.ACTIVE,

    workoutFocusTypeCode: 'hypertrophy',

    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,

    exercises: [
      {
        sourceKey: FREE_EXERCISE_DB_SOURCE,
        sourceExternalId: 'Pullups',
        orderIndex: 0,
        restTime: 180,
      },
      {
        sourceKey: FREE_EXERCISE_DB_SOURCE,
        sourceExternalId: 'Bent_Over_Barbell_Row',
        orderIndex: 1,
        restTime: 150,
      },
      {
        sourceKey: FREE_EXERCISE_DB_SOURCE,
        sourceExternalId: 'Face_Pull',
        orderIndex: 2,
        restTime: 90,
      },
      {
        sourceKey: FREE_EXERCISE_DB_SOURCE,
        sourceExternalId: 'Barbell_Curl',
        orderIndex: 3,
        restTime: 90,
      },
    ],
  },
  {
    code: 'leg-day',

    name: 'Leg Day',
    image_url: null,
    description: 'Quadriceps, hamstrings, glutes, and calves focused workout.',
    duration: 3600,

    plan_type: WorkoutPlanType.TEMPLATE,
    status: ContentStatus.ACTIVE,

    workoutFocusTypeCode: 'hypertrophy',

    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,

    exercises: [
      {
        sourceKey: FREE_EXERCISE_DB_SOURCE,
        sourceExternalId: 'Barbell_Squat',
        orderIndex: 0,
        restTime: 180,
      },
      {
        sourceKey: FREE_EXERCISE_DB_SOURCE,
        sourceExternalId: 'Romanian_Deadlift',
        orderIndex: 1,
        restTime: 180,
      },
      {
        sourceKey: FREE_EXERCISE_DB_SOURCE,
        sourceExternalId: 'Dumbbell_Lunges',
        orderIndex: 2,
        restTime: 120,
      },
      {
        sourceKey: FREE_EXERCISE_DB_SOURCE,
        sourceExternalId: 'Standing_Calf_Raises',
        orderIndex: 3,
        restTime: 90,
      },
    ],
  },
] satisfies WorkoutSeedData[];
