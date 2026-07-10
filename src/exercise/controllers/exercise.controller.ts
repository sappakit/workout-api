import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { type ActiveUserData, AuthType } from 'src/auth/enums/auth.enum';
import { Serialize } from 'src/common/interceptors/serialize/serialize.decorator';
import {
  ExerciseQueryDto,
  GetExercisesPerformanceQueryDto,
} from '../dto/exercise-query.dto';
import {
  ExerciseDto,
  ExercisePerformanceByExerciseIdDto,
} from '../dto/exercise-response.dto';
import { ExerciseService } from '../exercise.service';

@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  // Exercises
  @Auth(AuthType.PUBLIC)
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Get all exercises',
    type: ExerciseDto,
  })
  @Serialize(ExerciseDto)
  async findAllExercises(@Query() query: ExerciseQueryDto) {
    return this.exerciseService.findAllExercises(query);
  }

  // Get exercise performance summaries (Previous/best)
  @Auth(AuthType.USER)
  @Get('performance')
  @ApiResponse({
    status: 200,
    description: 'Get previous and best performance for exercises',
    type: ExercisePerformanceByExerciseIdDto,
  })
  @Serialize(ExercisePerformanceByExerciseIdDto)
  async getExercisesPerformance(
    @ActiveUser() user: ActiveUserData,
    @Query() query: GetExercisesPerformanceQueryDto,
  ) {
    return this.exerciseService.getExercisesPerformance(user, query);
  }

  // Exercise detail
  @Auth(AuthType.PUBLIC)
  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Get exercise detail',
    type: ExerciseDto,
  })
  @Serialize(ExerciseDto)
  async findOneExercise(@Param('id', ParseIntPipe) id: number) {
    return this.exerciseService.findOneExercise(id);
  }
}
