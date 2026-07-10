import {
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse } from '@nestjs/swagger';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth.enum';
import { Serialize } from 'src/common/interceptors/serialize/serialize.decorator';
import { UpdateMyProfileDto } from './dto/user-body.dto';
import { UserDto } from './dto/user-response.dto';
import { UserService } from './user.service';

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
  @UseInterceptors(FileInterceptor('image'))
  @ApiResponse({
    status: 200,
    description: 'Update profile information for the current user',
    type: UserDto,
  })
  @Serialize(UserDto)
  async updateMyProfile(
    @ActiveUser('sub') userId: number,
    @Body() dto: UpdateMyProfileDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.userService.updateMyProfile(userId, dto, image);
  }
}
