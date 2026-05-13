import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth.enum';
import { ApiResponse } from '@nestjs/swagger';
import { Serialize } from 'src/common/interceptors/serialize/serialize.decorator';
import { PagingDto } from 'src/common/dto/request.dto';
import { ExerciseService } from '../exercise.service';
import { ExerciseDto } from '../dto/exercise-response.dto';

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
  async findAllExercises(@Query() query: PagingDto) {
    return this.exerciseService.findAllExercises(query);
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
