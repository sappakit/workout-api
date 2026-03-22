import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { type ActiveUserData, AuthType } from 'src/auth/enums/auth.enum';
import { ApiResponse } from '@nestjs/swagger';
import { Serialize } from 'src/common/interceptors/serialize/serialize.decorator';
import { PagingDto } from 'src/common/dto/request.dto';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import { GetWorkoutScheduleQueryDto } from './dto/workout-query.dto';
import {
  EquipmentDto,
  ExerciseDto,
  MuscleDto,
  WorkoutDto,
  WorkoutFocusTypeDto,
  WorkoutScheduleDto,
} from './dto/workout-response.dto';
import { UpdateWorkoutDto } from './dto/workout-body.dto';
import { SuccessMessageDto } from 'src/common/dto/response.dto';

@Controller('workout')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  // Workouts
  @Auth(AuthType.PUBLIC)
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Get all workouts',
    type: WorkoutDto,
  })
  @Serialize(WorkoutDto)
  async findAllWorkouts(@Query() query: PagingDto) {
    return this.workoutService.findAllWorkouts(query);
  }

  // Schedule
  @Auth(AuthType.USER)
  @Get('schedule')
  @ApiResponse({
    status: 200,
    description: 'Get workout schedule by date',
    type: WorkoutScheduleDto,
  })
  @Serialize(WorkoutScheduleDto)
  async getScheduleByDate(
    @ActiveUser() user: ActiveUserData,
    @Query() query: GetWorkoutScheduleQueryDto,
  ) {
    return this.workoutService.getScheduleByDate(user, query);
  }

  // Exercises
  @Auth(AuthType.PUBLIC)
  @Get('exercises')
  @ApiResponse({
    status: 200,
    description: 'Get all exercises',
    type: ExerciseDto,
  })
  @Serialize(ExerciseDto)
  async findAllExercises(@Query() query: PagingDto) {
    return this.workoutService.findAllExercises(query);
  }

  // Muscles
  @Auth(AuthType.PUBLIC)
  @Get('muscles')
  @ApiResponse({
    status: 200,
    description: 'Get all muscles',
    type: MuscleDto,
  })
  @Serialize(MuscleDto)
  async findAllMuscles(@Query() query: PagingDto) {
    return this.workoutService.findAllMuscles(query);
  }

  // Equipment
  @Auth(AuthType.PUBLIC)
  @Get('equipment')
  @ApiResponse({
    status: 200,
    description: 'Get all equipment',
    type: EquipmentDto,
  })
  @Serialize(EquipmentDto)
  async findAllEquipment(@Query() query: PagingDto) {
    return this.workoutService.findAllEquipment(query);
  }

  // Workout focus type
  @Auth(AuthType.PUBLIC)
  @Get('types')
  @ApiResponse({
    status: 200,
    description: 'Get all workout focus types',
    type: WorkoutFocusTypeDto,
  })
  @Serialize(WorkoutFocusTypeDto)
  async findAllWorkoutFocusTypes(@Query() query: PagingDto) {
    return this.workoutService.findAllWorkoutFocusTypes(query);
  }

  // Workout
  @Auth(AuthType.PUBLIC)
  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Get workout detail',
    type: WorkoutDto,
  })
  @Serialize(WorkoutDto)
  async findOneWorkout(@Param('id', ParseIntPipe) id: number) {
    return this.workoutService.findOneWorkout(id);
  }

  // Update workout
  @Auth(AuthType.PUBLIC)
  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'Update workout',
    type: SuccessMessageDto,
  })
  @Serialize(SuccessMessageDto)
  async updateWorkout(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateWorkoutDto,
  ) {
    return this.workoutService.updateWorkout(id, body);
  }
}
