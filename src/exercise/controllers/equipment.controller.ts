import { Controller, Get, Query } from '@nestjs/common';
import { ExerciseService } from '../exercise.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ApiResponse } from '@nestjs/swagger';
import { AuthType } from 'src/auth/enums/auth.enum';
import { Serialize } from 'src/common/interceptors/serialize/serialize.decorator';
import { PagingDto } from 'src/common/dto/request.dto';
import { EquipmentDto } from '../dto/exercise-response.dto';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly exerciseService: ExerciseService) {}

  // Equipment
  @Auth(AuthType.PUBLIC)
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Get all equipment',
    type: EquipmentDto,
  })
  @Serialize(EquipmentDto)
  async findAllEquipment(@Query() query: PagingDto) {
    return this.exerciseService.findAllEquipment(query);
  }
}
