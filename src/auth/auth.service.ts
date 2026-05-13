import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User, UserProfile } from 'db/entities/auth';
import { DataSource, Repository } from 'typeorm';
import { HashingService } from 'src/hashing/services/hashing.service';
import { TokenService } from './token/token.service';
import { LoginDto, RegisterDto } from './dto/auth-body.dto';
import { LocalValidatedUser } from './enums/auth.enum';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokenStore } from './session/refresh-session.store';
import { hashToken } from 'utils/hash.util';
import { nowSec } from 'utils/time.util';
import { IssueTokenParams } from './token/types/token.types';
import { DEFAULT_ROLE_CODE } from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private dataSource: DataSource,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly refreshStore: RefreshTokenStore,

    // Repository
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

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

  async loadUser(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { role: true },
      select: {
        id: true,
        username: true,
        email: true,
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

  async register(dto: RegisterDto) {
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

  async login(user: LocalValidatedUser) {
    const sid = uuidv4();

    const { accessToken, refreshToken } = await this.issueAndStoreTokens({
      sid,
      userId: user.id,
      username: user.username,
      role: user.role.code,
    });

    // Return response
    const response = {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: {
          code: user.role.code,
          name: user.role.name,
        },
      },
    };

    return response;
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
    const user = await this.loadUser(session.userId);

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
}
