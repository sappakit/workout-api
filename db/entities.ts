import { Menu, Role, RoleMenu, User, UserProfile } from './entities/auth';
import {
  Equipment,
  Exercise,
  ExerciseCategory,
  ExerciseEquipment,
  ExerciseMedia,
  ExerciseMuscle,
  ExerciseSource,
  ExerciseUserStat,
  Muscle,
  Workout,
  WorkoutExercise,
  WorkoutExerciseSet,
  WorkoutFocusType,
  WorkoutMuscle,
  WorkoutSchedule,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSessionExerciseSet,
  WorkoutWeeklyPlan,
} from './entities/workout';

export const AllEntities = [
  // Auth
  User,
  UserProfile,
  Role,
  Menu,
  RoleMenu,

  // Workout
  Exercise,
  ExerciseSource,
  ExerciseMedia,
  ExerciseEquipment,
  ExerciseMuscle,
  ExerciseUserStat,
  ExerciseCategory,

  Workout,
  WorkoutExercise,
  WorkoutExerciseSet,
  WorkoutMuscle,
  WorkoutSchedule,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSessionExerciseSet,
  WorkoutWeeklyPlan,
  WorkoutFocusType,

  Equipment,
  Muscle,
];
