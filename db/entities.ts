import { Menu, Role, RoleMenu, User, UserProfile } from './entities/auth';
import {
  Equipment,
  Exercise,
  ExerciseEquipment,
  ExerciseMuscle,
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
  WorkoutSet,
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
  ExerciseEquipment,
  ExerciseMuscle,
  ExerciseUserStat,

  Workout,
  WorkoutExercise,
  WorkoutExerciseSet,
  WorkoutMuscle,
  WorkoutSchedule,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet,
  WorkoutWeeklyPlan,
  WorkoutFocusType,

  Equipment,
  Muscle,
];
