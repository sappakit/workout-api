import { Controller, Get, Query } from '@nestjs/common';
import { ExerciseService } from '../exercise.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ApiResponse } from '@nestjs/swagger';
import { MuscleDto } from '../dto/exercise-response.dto';
import { AuthType } from 'src/auth/enums/auth.enum';
import { Serialize } from 'src/common/interceptors/serialize/serialize.decorator';
import { PagingDto } from 'src/common/dto/request.dto';

@Controller('muscles')
export class MusclesController {
  constructor(private readonly exerciseService: ExerciseService) {}

  // Muscles
  @Auth(AuthType.PUBLIC)
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Get all muscles',
    type: MuscleDto,
  })
  @Serialize(MuscleDto)
  async findAllMuscles(@Query() query: PagingDto) {
    return this.exerciseService.findAllMuscles(query);
  }
}
