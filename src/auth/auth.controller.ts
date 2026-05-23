import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { type LocalValidatedUser, AuthType } from './enums/auth.enum';
import { ApiResponse } from '@nestjs/swagger';
import { Serialize } from 'src/common/interceptors/serialize/serialize.decorator';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth-body.dto';
import {
  AuthUserDto,
  LoginResponseDto,
  TokenPairResponseDto,
} from './dto/auth-response.dto';
import { SuccessMessageDto } from 'src/common/dto/response.dto';
import { ActiveUser } from './decorators/active-user.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Auth(AuthType.PUBLIC)
  @Post('register')
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: LoginResponseDto,
  })
  @Serialize(LoginResponseDto)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Auth(AuthType.PUBLIC)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: LoginResponseDto,
  })
  @Serialize(LoginResponseDto)
  async login(@Body() _dto: LoginDto, @ActiveUser() user: LocalValidatedUser) {
    return this.authService.login(user);
  }

  @Auth(AuthType.PUBLIC)
  @Post('logout')
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
    type: SuccessMessageDto,
  })
  @Serialize(SuccessMessageDto)
  async logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Auth(AuthType.USER)
  @Get('me')
  @ApiResponse({
    status: 200,
    description: 'Get the currently authenticated user',
    type: AuthUserDto,
  })
  @Serialize(AuthUserDto)
  async getCurrentUser(@ActiveUser('sub') userId: number) {
    return this.authService.getCurrentUser(userId);
  }

  @Auth(AuthType.PUBLIC)
  @Post('refresh')
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
