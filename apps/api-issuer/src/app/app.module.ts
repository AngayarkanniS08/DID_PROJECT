import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Student } from './entities/student.entity';
import { Credential } from './entities/credential.entity';
import { Organization } from './entities/organization.entity';
import { Admin } from './entities/admin.entity';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { SetupModule } from './setup/setup.module';
import { MerkleModule } from './merkle/merkle.module';
import { MailerModule } from './mailer/mailer.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'secure_verify',
      entities: [Student, Credential, Organization, Admin],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Student, Credential, Organization, Admin]),
    AuthModule,
    StudentsModule,
    SetupModule,
    MerkleModule,
    MailerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
