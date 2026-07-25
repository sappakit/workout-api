import { BadRequestException } from '@nestjs/common';
import { Exercise } from 'db/entities/workout/exercise/exercises.entity';
import { Muscle } from 'db/entities/workout/shared/muscles.entity';
import { WorkoutFocusType } from 'db/entities/workout/workout/workout-focus-types.entity';
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

  // Allow duplicate exercises, but validate each unique exercise id only once
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
