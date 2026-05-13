import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth.enum';
import { ApiResponse } from '@nestjs/swagger';
import { Serialize } from 'src/common/interceptors/serialize/serialize.decorator';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import { UserDto } from './dto/user-response.dto';
import { UpdateMyProfileDto } from './dto/user-body.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Auth(AuthType.USER)
  @Get('me/profile')
  @ApiResponse({
    status: 200,
    description: 'Get editable profile information for the current user',
    type: UserDto,
  })
  @Serialize(UserDto)
  async getMyProfile(@ActiveUser('sub') userId: number) {
    return this.userService.getMyProfile(userId);
  }

  @Auth(AuthType.USER)
  @Patch('me/profile')
  @ApiResponse({
    status: 200,
    description: 'Update profile information for the current user',
    type: UserDto,
  })
  @Serialize(UserDto)
  async updateMyProfile(
    @ActiveUser('sub') userId: number,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.userService.updateMyProfile(userId, dto);
  }
}
