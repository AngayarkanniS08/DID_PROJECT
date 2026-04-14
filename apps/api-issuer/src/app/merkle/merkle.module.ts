import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { Student } from '../entities/student.entity';
import { MerkleService } from './merkle.service';
import { MerkleController } from './merkle.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student]),
    ScheduleModule.forRoot(),
    ConfigModule,
  ],
  controllers: [MerkleController],
  providers: [MerkleService],
  exports: [MerkleService], // so StudentsService can call getProofForDID()
})
export class MerkleModule {}
