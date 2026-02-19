import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import {
  type ActiveUserData,
  type LocalValidatedUser,
  AuthType,
} from './enums/auth.enum';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { Serialize } from 'src/common/interceptors/serialize/serialize.decorator';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth-body.dto';
import {
  LoginResponseDto,
  TokenPairResponseDto,
  UserResponseDto,
} from './dto/auth-response.dto';
import { SuccessMessageDto } from 'src/common/dto/response.dto';
import { ActiveUser } from './decorators/active-user.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';

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
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: LoginResponseDto,
  })
  @Serialize(LoginResponseDto)
  async login(@Body() _dto: LoginDto, @ActiveUser() user: LocalValidatedUser) {
    return this.authService.login(user);
  }

  @Auth(AuthType.USER)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Get the currently authenticated user',
    type: UserResponseDto,
  })
  @Serialize(UserResponseDto)
  async loadUser(@ActiveUser('sub') userId: number) {
    return this.authService.loadUser(userId);
  }

  @Auth(AuthType.PUBLIC)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Refresh access token and rotate refresh token',
    type: TokenPairResponseDto,
  })
  @Serialize(TokenPairResponseDto)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }
}
