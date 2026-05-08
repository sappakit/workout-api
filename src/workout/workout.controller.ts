import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
  WorkoutCurrentDto,
  WorkoutDto,
  WorkoutFocusTypeDto,
  WorkoutProgressOverviewDto,
  WorkoutScheduleDto,
  WorkoutSessionDto,
} from './dto/workout-response.dto';
import {
  FinishWorkoutSessionDto,
  UpdateWorkoutDto,
} from './dto/workout-body.dto';
import { SuccessMessageDto } from 'src/common/dto/response.dto';

@Controller('workouts')
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

  // Get workout progress overview
  @Auth(AuthType.USER)
  @Get('progress/overview')
  @ApiResponse({
    status: 200,
    description: 'Get workout progress overview',
    type: WorkoutProgressOverviewDto,
  })
  @Serialize(WorkoutProgressOverviewDto)
  async getProgressOverview(@ActiveUser() user: ActiveUserData) {
    return this.workoutService.getProgressOverview(user);
  }

  // Get current workout state for today
  // (in-progress session, scheduled workout, or rest day)
  @Auth(AuthType.USER)
  @Get('current')
  @ApiResponse({
    status: 200,
    description: 'Get current workout state',
    type: WorkoutCurrentDto,
  })
  @Serialize(WorkoutCurrentDto)
  async getCurrentWorkout(@ActiveUser() user: ActiveUserData) {
    return this.workoutService.getCurrentWorkout(user);
  }

  // Get user workout session history
  @Auth(AuthType.USER)
  @Get('sessions/history')
  @ApiResponse({
    status: 200,
    description: 'Get workout session history',
    type: [WorkoutSessionDto],
  })
  @Serialize(WorkoutSessionDto)
  async getWorkoutSessionHistory(
    @ActiveUser() user: ActiveUserData,
    @Query() query: PagingDto,
  ) {
    return this.workoutService.getWorkoutSessionHistory(user, query);
  }

  // Finish workout session
  @Auth(AuthType.PUBLIC)
  @Patch('sessions/:id/finish')
  @ApiResponse({
    status: 200,
    description: 'Finish workout session',
    type: SuccessMessageDto,
  })
  @Serialize(SuccessMessageDto)
  async finishWorkoutSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: FinishWorkoutSessionDto,
  ) {
    return this.workoutService.finishWorkoutSession(id, body);
  }

  // Cancel session
  @Auth(AuthType.USER)
  @Post('sessions/:id/cancel')
  @ApiResponse({
    status: 200,
    description: 'Cancel workout session',
    type: SuccessMessageDto,
  })
  @Serialize(SuccessMessageDto)
  async cancelWorkoutSession(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.workoutService.cancelWorkoutSession(id, user);
  }

  // Start or resume a workout session by workout id
  @Auth(AuthType.USER)
  @Post(':workoutId/sessions/start')
  @ApiResponse({
    status: 200,
    description: 'Start or resume a workout session',
    type: WorkoutSessionDto,
  })
  @Serialize(WorkoutSessionDto)
  async startWorkoutSession(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.workoutService.startWorkoutSession(workoutId, user);
  }

  // Workout detail
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
