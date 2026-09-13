export const CLOUDINARY_FOLDERS = {
  PROFILE_IMAGES: 'workout-app/profile',
  EXERCISE_IMAGES: 'workout-app/exercise',
  FREE_EXERCISE_DB_IMAGES: 'workout-app/exercise/free-exercise-db',
  WORKOUT_IMAGES: 'workout-app/workout',
} as const;

export type CLOUDINARY_FOLDERS =
  (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];

export const CLOUDINARY_TRANSFORMATIONS = {
  PROFILE_IMAGE: {
    width: 1600,
    height: 1600,
    crop: 'limit',
  },

  EXERCISE_IMAGE: {
    width: 2000,
    height: 2000,
    crop: 'limit',
  },

  WORKOUT_IMAGE: {
    width: 2000,
    height: 2000,
    crop: 'limit',
  },
} as const;

export type CLOUDINARY_TRANSFORMATIONS =
  (typeof CLOUDINARY_TRANSFORMATIONS)[keyof typeof CLOUDINARY_TRANSFORMATIONS];
