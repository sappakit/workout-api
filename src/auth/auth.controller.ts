import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth.enum';
import { ApiResponse } from '@nestjs/swagger';
import { Serialize } from 'src/common/interceptors/serialize/serialize.decorator';
import { LoginDto, RegisterDto } from './dto/auth-body.dto';
import { LoginResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { SuccessMessageDto } from 'src/common/dto/response.dto';

@Controller('auth')
@Serialize(UserResponseDto)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Auth(AuthType.PUBLIC)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: SuccessMessageDto,
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Auth(AuthType.PUBLIC)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: LoginResponseDto,
  })
  @Serialize(LoginResponseDto)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
