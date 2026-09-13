import { Menu } from './entities/auth/menu.entity';
import { RoleMenu } from './entities/auth/role-menu.entity';
import { Role } from './entities/auth/role.entity';
import { UserProfile } from './entities/auth/user-profile.entity';
import { User } from './entities/auth/user.entity';
import { ExerciseCategory } from './entities/workout/exercise/exercise-category.entity';
import { ExerciseEquipment } from './entities/workout/exercise/exercise-equipment.entity';
import { ExerciseMedia } from './entities/workout/exercise/exercise-media.entity';
import { ExerciseMuscle } from './entities/workout/exercise/exercise-muscles.entity';
import { ExerciseSource } from './entities/workout/exercise/exercise-source.entity';
import { ExerciseTrackingType } from './entities/workout/exercise/exercise-tracking-type.entity';
import { ExerciseUserStat } from './entities/workout/exercise/exercise-user-stats.entity';
import { Exercise } from './entities/workout/exercise/exercises.entity';
import { Equipment } from './entities/workout/shared/equipment.entity';
import { Muscle } from './entities/workout/shared/muscles.entity';
import { WorkoutExerciseSet } from './entities/workout/workout/workout-exercise-sets.entity';
import { WorkoutExercise } from './entities/workout/workout/workout-exercises.entity';
import { WorkoutFocusType } from './entities/workout/workout/workout-focus-types.entity';
import { WorkoutMuscle } from './entities/workout/workout/workout-muscles.entity';
import { WorkoutSchedule } from './entities/workout/workout/workout-schedule.entity';
import { WorkoutSessionExerciseSet } from './entities/workout/workout/workout-session-exercise-sets.entity';
import { WorkoutSessionExercise } from './entities/workout/workout/workout-session-exercises.entity';
import { WorkoutSession } from './entities/workout/workout/workout-sessions.entity';
import { WorkoutWeeklyPlan } from './entities/workout/workout/workout-weekly-plan.entity';
import { Workout } from './entities/workout/workout/workouts.entity';

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
  ExerciseTrackingType,

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
