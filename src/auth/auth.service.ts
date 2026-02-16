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
import { ActiveUserData, LocalValidatedUser } from './enums/auth.enum';

@Injectable()
export class AuthService {
  constructor(
    private dataSource: DataSource,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,

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

  async register(dto: RegisterDto) {
    // Normalize input
    const username = dto.username.trim();
    const email = dto.email.trim().toLowerCase();
    const password = dto.password;
    const firstName = dto.firstName?.trim();
    const lastName = dto.lastName?.trim();

    await this.dataSource.transaction(async (manager) => {
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
        where: { code: 'USER' },
      });

      if (!role) {
        throw new InternalServerErrorException('Default role not found');
      }

      // Create user
      const user = manager.create(User, {
        username,
        email,
        password_hash: passwordHash,
        role,
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
    });

    return { message: 'User created successfully' };
  }

  async login(user: LocalValidatedUser) {
    // Generate tokens
    const accessTokenPromise = this.tokenService.generateAccessToken({
      sub: user.id,
      username: user.username,
      role: user.role.code,
    });

    const refreshTokenPromise = this.tokenService.generateRefreshToken({
      sub: user.id,
    });

    const [accessToken, refreshToken] = await Promise.all([
      accessTokenPromise,
      refreshTokenPromise,
    ]);

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
}
