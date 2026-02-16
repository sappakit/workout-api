import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'db/entities/auth';

@Injectable()
export class WorkoutService {
  constructor(
    private dataSource: DataSource,

    // Repository
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  
}
