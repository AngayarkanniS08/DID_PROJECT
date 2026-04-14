import { Module } from '@nestjs/common';
import { DigilockerController } from './digilocker.controller';
import { DigilockerService } from './digilocker.service';
import { StudentsModule } from '../students/students.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [StudentsModule, ConfigModule],
  controllers: [DigilockerController],
  providers: [DigilockerService],
  exports: [DigilockerService],
})
export class DigilockerModule {}
