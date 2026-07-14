import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User, UserProfile } from 'db/entities/auth';
import { generateSecureToken, hashToken } from 'src/common/utils/security.util';
import { EmailService } from 'src/email/email.service';
import { HashingService } from 'src/hashing/services/hashing.service';
import { DataSource, Repository } from 'typeorm';
import { nowSec } from 'utils/time.util';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_ROLE_CODE } from './auth.constants';
import {
  ChangeMyPasswordDto,
  CreateUserInput,
  LoginDto,
  RegisterDto,
} from './dto/auth-body.dto';
import { ActiveUserData, LocalValidatedUser } from './enums/auth.enum';
import { PasswordResetTokenStore } from './session/password-reset-token.store';
import { RefreshTokenStore } from './session/refresh-token.store';
import { TokenService } from './token/token.service';
import { IssueTokenParams } from './token/types/token.types';

@Injectable()
export class AuthService {
  private readonly resetPasswordUrl: string;
  private readonly passwordResetTokenTtl: number;

  constructor(
    private readonly dataSource: DataSource,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly refreshStore: RefreshTokenStore,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly passwordResetTokenStore: PasswordResetTokenStore,

    // Repository
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {
    this.resetPasswordUrl = this.configService.getOrThrow<string>(
      'APP_RESET_PASSWORD_URL',
    );

    this.passwordResetTokenTtl = this.configService.getOrThrow<number>(
      'PASSWORD_RESET_TOKEN_TTL',
    );
  }

  async validateUser(dto: LoginDto) {
    const { identifier: identifierRaw, password } = dto;

    const identifier = identifierRaw.trim();
    const identifierLower = identifier.toLowerCase();

    const user = await this.userRepo.findOne({
      where: [{ username: identifier }, { email: identifierLower }],
      relations: { role: true },
      select: {
        id: true,
        username: true,
        email: true,
        password_hash: true,
        role: {
          code: true,
          name: true,
        },
      },
    });

    if (!user) return null;

    const isPasswordValid = await this.hashingService.compare(
      password,
      user.password_hash,
    );

    if (!isPasswordValid) return null;

    return user;
  }

  async getCurrentUser(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: {
        profile: true,
        role: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        profile: {
          first_name: true,
          last_name: true,
          image_url: true,
        },
        role: {
          code: true,
          name: true,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async register_old(dto: RegisterDto) {
    // Normalize input
    const username = dto.username.trim();
    const email = dto.email.trim().toLowerCase();
    const password = dto.password;
    const firstName = dto.firstName?.trim();
    const lastName = dto.lastName?.trim();

    const user = await this.dataSource.transaction(async (manager) => {
      // Check user existence
      const [usernameExists, emailExists] = await Promise.all([
        manager.exists(User, { where: { username } }),
        manager.exists(User, { where: { email } }),
      ]);

      if (usernameExists) {
        throw new ConflictException('Username already exists');
      }

      if (emailExists) {
        throw new ConflictException('Email already exists');
      }

      // Hash password
      const passwordHash = await this.hashingService.hash(password);

      // Get default role
      const role = await manager.findOne(Role, {
        where: { code: DEFAULT_ROLE_CODE },
      });

      if (!role) {
        throw new InternalServerErrorException('Default role not found');
      }

      // Create user
      const newUser = manager.create(User, {
        username,
        email,
        password_hash: passwordHash,
        role,
        created_by: username,
        updated_by: username,
      });

      await manager.save(newUser);

      // Create user profile
      const profile = manager.create(UserProfile, {
        first_name: firstName,
        last_name: lastName,
        user: newUser,
        created_by: username,
        updated_by: username,
      });

      await manager.save(profile);
      return newUser;
    });

    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: {
        code: user.role.code,
        name: user.role.name,
      },
    };

    // Auto login after registration
    return this.login(payload);
  }

  async register(dto: RegisterDto) {
    const user = await this.createUser({
      username: dto.username,
      email: dto.email,
      password: dto.password,
      roleCode: DEFAULT_ROLE_CODE,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: {
        code: user.role.code,
        name: user.role.name,
      },
    };

    // Auto login after registration
    return this.login(payload);
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();
    const firstName = input.firstName?.trim();
    const lastName = input.lastName?.trim();

    return this.dataSource.transaction(async (manager) => {
      // Check whether username or email already exists
      const [usernameExists, emailExists] = await Promise.all([
        manager.exists(User, {
          where: { username },
        }),
        manager.exists(User, {
          where: { email },
        }),
      ]);

      if (usernameExists) {
        throw new ConflictException('Username already exists');
      }

      if (emailExists) {
        throw new ConflictException('Email already exists');
      }

      // Hash password
      const passwordHash = await this.hashingService.hash(input.password);

      // Find the requested role
      const role = await manager.findOne(Role, {
        where: {
          code: input.roleCode,
        },
      });

      if (!role) {
        throw new InternalServerErrorException(
          `Role "${input.roleCode}" not found`,
        );
      }

      // Create user
      const user = manager.create(User, {
        username,
        email,
        password_hash: passwordHash,
        role,
        login_attempts: 0,
        is_reset_password: false,
        created_by: username,
        updated_by: username,
      });

      await manager.save(user);

      // Create user profile
      const profile = manager.create(UserProfile, {
        first_name: firstName,
        last_name: lastName,
        user,
        created_by: username,
        updated_by: username,
      });

      await manager.save(profile);

      return user;
    });
  }

  async login(user: LocalValidatedUser) {
    const sid = uuidv4();

    const { accessToken, refreshToken } = await this.issueAndStoreTokens({
      sid,
      userId: user.id,
      username: user.username,
      role: user.role.code,
    });

    const authUser = await this.getCurrentUser(user.id);

    return {
      accessToken,
      refreshToken,
      user: authUser,
    };
  }

  async logout(refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    await this.refreshStore.deleteSession(payload.sid);

    return { message: 'Logged out successfully' };
  }

  // Tokens logic
  async issueAndStoreTokens(params: IssueTokenParams) {
    const { sid, userId, username, role, prevSess } = params;

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken({
        sub: userId,
        sid,
        username,
        role,
        typ: 'access',
      }),
      this.tokenService.generateRefreshToken({
        sub: userId,
        sid,
        typ: 'refresh',
      }),
    ]);

    const tokenHash = hashToken(refreshToken);
    const ttl = this.tokenService.refreshTtlSeconds();
    const now = nowSec();

    await this.refreshStore.saveSession(
      sid,
      {
        userId,
        tokenHash,
        createdAt: prevSess?.createdAt ?? now,
        rotatedAt: now,
      },
      ttl,
    );

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    const session = await this.refreshStore.getSession(payload.sid);
    if (!session) throw new UnauthorizedException('Session expired');

    // reuse/mismatch detection
    const incomingHash = hashToken(refreshToken);
    if (session.tokenHash !== incomingHash) {
      await this.refreshStore.deleteSession(payload.sid);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    // invariant check
    if (payload.sub !== session.userId) {
      await this.refreshStore.deleteSession(payload.sid);
      throw new UnauthorizedException('Invalid session');
    }

    // get user detail
    const user = await this.getCurrentUser(session.userId);

    // rotate
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await this.issueAndStoreTokens({
        sid: payload.sid,
        userId: user.id,
        username: user.username,
        role: user.role.code,
        prevSess: session,
      });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // Forgot password
  async forgotPassword(email: string) {
    const token = await this.createPasswordResetToken(email);

    if (token) {
      const resetUrl = `${this.resetPasswordUrl}?token=${token}`;

      await this.emailService.sendPasswordResetEmail(email, resetUrl, {
        expiresInMinutes: Math.floor(this.passwordResetTokenTtl / 60),
      });
    }

    return {
      message: 'If an account exists, password reset instructions were sent.',
    };
  }

  private async createPasswordResetToken(
    email: string,
  ): Promise<string | null> {
    const user = await this.userRepo.findOne({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);

    await this.passwordResetTokenStore.saveToken(
      tokenHash,
      { userId: user.id },
      this.passwordResetTokenTtl,
    );

    return rawToken;
  }

  // Reset password
  async resetPassword(token: string, password: string) {
    const { tokenHash, resetToken } =
      await this.getValidPasswordResetToken(token);

    const passwordHash = await this.hashingService.hash(password);

    await this.userRepo.update(resetToken.userId, {
      password_hash: passwordHash,
    });

    await this.refreshStore.deleteAllUserSessions(resetToken.userId);

    await this.passwordResetTokenStore.deleteToken(tokenHash);

    return { message: 'Password has been reset successfully.' };
  }

  async verifyPasswordResetToken(token: string) {
    await this.getValidPasswordResetToken(token);

    return { message: 'Reset token is valid.' };
  }

  private async getValidPasswordResetToken(token: string) {
    const tokenHash = hashToken(token);

    const resetToken = await this.passwordResetTokenStore.getToken(tokenHash);

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    return {
      tokenHash,
      resetToken,
    };
  }

  async changeMyPassword(user: ActiveUserData, dto: ChangeMyPasswordDto) {
    const currentUser = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.id = :id', { id: user.sub })
      .getOne();

    if (!currentUser) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await this.hashingService.compare(
      dto.currentPassword,
      currentUser.password_hash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const isSamePassword = await this.hashingService.compare(
      dto.newPassword,
      currentUser.password_hash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const passwordHash = await this.hashingService.hash(dto.newPassword);

    await this.userRepo.update(currentUser.id, {
      password_hash: passwordHash,
    });

    await this.refreshStore.deleteOtherUserSessions(currentUser.id, user.sid);

    return {
      message: 'Password has been changed successfully.',
    };
  }
}
