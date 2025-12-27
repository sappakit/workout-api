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

  async register(dto: RegisterDto) {
    const { username, email, password, firstName, lastName } = dto;

    await this.dataSource.transaction(async (manager) => {
      // Check username
      const existingUser = await manager.findOne(User, {
        where: { username },
      });

      if (existingUser) {
        throw new ConflictException('Username already exists');
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

  async login(dto: LoginDto) {
    const { username, password } = dto;

    const user = await this.userRepo.findOne({
      where: { username },
      relations: { role: true },
      select: {
        id: true,
        username: true,
        password_hash: true,
        role: {
          code: true,
          name: true,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await this.hashingService.compare(
      password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const accessTokenPromise = this.tokenService.generateAccessToken({
      sub: user.id,
      username: user.username,
    });

    const refreshTokenPromise = this.tokenService.generateRefreshToken({
      sub: user.id,
    });

    const [accessToken, refreshToken] = await Promise.all([
      accessTokenPromise,
      refreshTokenPromise,
    ]);

    const response = {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: {
          code: user.role.code,
          name: user.role.name,
        },
      },
    };

    return response;
  }
}
