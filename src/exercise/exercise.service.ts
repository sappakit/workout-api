import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equipment, Exercise, Muscle } from 'db/entities/workout';
import { PagingDto } from 'src/common/dto/request.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { FindManyOptions, Repository } from 'typeorm';

@Injectable()
export class ExerciseService {
  constructor(
    private paginationService: PaginationService,

    // Repository
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(Muscle)
    private readonly muscleRepo: Repository<Muscle>,
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
  ) {}

  // Exercises
  async findAllExercises(query: PagingDto) {
    const options: FindManyOptions<Exercise> = {
      relations: {
        muscles: { muscle: true },
        equipment_links: { equipment: true },
      },
      order: { name: 'ASC' },
    };

    const searchFields = [
      'name',
      'exercise_type',
      'difficulty_level',
      'muscles.muscle.name',
    ];

    return this.paginationService.paginateRepository(
      this.exerciseRepo,
      options,
      query,
      { searchFields },
    );
  }

  async findOneExercise(id: number) {
    const results = await this.exerciseRepo.findOne({ where: { id } });

    if (!results) {
      throw new NotFoundException('Workout not found');
    }

    return results;
  }

  // Muscles
  async findAllMuscles(query: PagingDto) {
    const options: FindManyOptions<Muscle> = {
      order: { name: 'ASC' },
    };

    return this.paginationService.paginateRepository(
      this.muscleRepo,
      options,
      query,
    );
  }

  // Equipment
  async findAllEquipment(query: PagingDto) {
    const options: FindManyOptions<Equipment> = {
      order: { name: 'ASC' },
    };

    return this.paginationService.paginateRepository(
      this.equipmentRepo,
      options,
      query,
    );
  }
}
