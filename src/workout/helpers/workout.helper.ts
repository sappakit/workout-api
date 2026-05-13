import { BadRequestException } from '@nestjs/common';
import { Exercise, Muscle, WorkoutFocusType } from 'db/entities/workout';
import { EntityManager, In } from 'typeorm';
import { SaveWorkoutDto } from '../dto/workout-body.dto';

export type ValidatedWorkoutSavePayload = {
  focusType: WorkoutFocusType | null;
  exerciseMap: Map<number, Exercise>;
  uniqueMuscleIds: number[];
};

// Validate workout save payload
export async function validateWorkoutSavePayload(
  manager: EntityManager,
  payload: SaveWorkoutDto,
): Promise<ValidatedWorkoutSavePayload> {
  const workoutFocusTypeRepo = manager.getRepository(WorkoutFocusType);
  const exerciseRepo = manager.getRepository(Exercise);
  const muscleRepo = manager.getRepository(Muscle);

  let focusType: WorkoutFocusType | null = null;

  if (payload.workoutFocusTypeId != null) {
    focusType = await workoutFocusTypeRepo.findOne({
      where: { id: payload.workoutFocusTypeId },
    });

    if (!focusType) {
      throw new BadRequestException('Workout focus type not found');
    }
  }

  const uniqueExerciseIds = [
    ...new Set(payload.workoutExercises.map((item) => item.exerciseId)),
  ];

  // Guard against duplicate exercise in same workout
  if (uniqueExerciseIds.length !== payload.workoutExercises.length) {
    throw new BadRequestException(
      'Duplicate exerciseId is not allowed in the same workout',
    );
  }

  // Validate exercise ids
  const exercises = await exerciseRepo.find({
    where: { id: In(uniqueExerciseIds) },
  });

  if (exercises.length !== uniqueExerciseIds.length) {
    throw new BadRequestException('One or more exercises not found');
  }

  const exerciseMap = new Map(exercises.map((item) => [item.id, item]));

  // Validate muscle ids
  const uniqueMuscleIds = [...new Set(payload.targetMuscles)].sort(
    (a, b) => a - b,
  );

  const muscles = uniqueMuscleIds.length
    ? await muscleRepo.find({
        where: { id: In(uniqueMuscleIds) },
      })
    : [];

  if (muscles.length !== uniqueMuscleIds.length) {
    throw new BadRequestException('One or more target muscles not found');
  }

  return {
    focusType,
    exerciseMap,
    uniqueMuscleIds,
  };
}
