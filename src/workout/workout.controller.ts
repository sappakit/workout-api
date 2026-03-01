import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { type ActiveUserData, AuthType } from 'src/auth/enums/auth.enum';
import { ApiResponse } from '@nestjs/swagger';
import { Serialize } from 'src/common/interceptors/serialize/serialize.decorator';
import {
  EquipmentResponseDto,
  ExerciseResponseDto,
  MuscleResponseDto,
  WorkoutResponseDto,
  WorkoutScheduleResponseDto,
} from './dto/workout-response.dto';
import { PagingDto } from 'src/common/dto/request.dto';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import { GetWorkoutScheduleQueryDto } from './dto/workout-query.dto';

@Controller('workout')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  // Workouts
  @Auth(AuthType.PUBLIC)
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Get all workouts',
    type: WorkoutResponseDto,
  })
  @Serialize(WorkoutResponseDto)
  async findAllWorkouts(@Query() query: PagingDto) {
    return this.workoutService.findAllWorkouts(query);
  }

  // Schedule
  @Auth(AuthType.USER)
  @Get('schedule')
  @ApiResponse({
    status: 200,
    description: 'Get workout schedule by date',
    type: WorkoutScheduleResponseDto,
  })
  @Serialize(WorkoutScheduleResponseDto)
  async getScheduleByDate(
    @ActiveUser() user: ActiveUserData,
    @Query() query: GetWorkoutScheduleQueryDto,
  ) {
    return this.workoutService.getScheduleByDate(user, query);
  }

  @Auth(AuthType.PUBLIC)
  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Get workout detail',
    type: WorkoutResponseDto,
  })
  @Serialize(WorkoutResponseDto)
  async findOneWorkout(@Param('id', ParseIntPipe) id: number) {
    return this.workoutService.findOneWorkout(id);
  }

  // Exercises
  @Auth(AuthType.PUBLIC)
  @Get('exercises')
  @ApiResponse({
    status: 200,
    description: 'Get all exercises',
    type: ExerciseResponseDto,
  })
  @Serialize(ExerciseResponseDto)
  async findAllExercises(@Query() query: PagingDto) {
    return this.workoutService.findAllExercises(query);
  }

  // Muscles
  @Auth(AuthType.PUBLIC)
  @Get('muscles')
  @ApiResponse({
    status: 200,
    description: 'Get all muscles',
    type: MuscleResponseDto,
  })
  @Serialize(MuscleResponseDto)
  async findAllMuscles(@Query() query: PagingDto) {
    return this.workoutService.findAllMuscles(query);
  }

  // Equipment
  @Auth(AuthType.PUBLIC)
  @Get('equipment')
  @ApiResponse({
    status: 200,
    description: 'Get all equipment',
    type: EquipmentResponseDto,
  })
  @Serialize(EquipmentResponseDto)
  async findAllEquipment(@Query() query: PagingDto) {
    return this.workoutService.findAllEquipment(query);
  }
}
