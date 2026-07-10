export const CLOUDINARY_FOLDERS = {
  PROFILE_IMAGES: 'workout-app/profile',
  EXERCISE_IMAGES: 'workout-app/exercise',
  WORKOUT_IMAGES: 'workout-app/workout',
} as const;

export type CLOUDINARY_FOLDERS =
  (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];

export const CLOUDINARY_TRANSFORMATIONS = {
  PROFILE_IMAGE: {
    width: 600,
    height: 600,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
  },

  EXERCISE_IMAGE: {
    width: 1200,
    height: 800,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },

  WORKOUT_IMAGE: {
    width: 1200,
    height: 800,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },
} as const;

export type CLOUDINARY_TRANSFORMATIONS =
  (typeof CLOUDINARY_TRANSFORMATIONS)[keyof typeof CLOUDINARY_TRANSFORMATIONS];
