import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Admin } from '../entities/admin.entity';
import { Organization } from '../entities/organization.entity';


@Module({
    imports: [
        TypeOrmModule.forFeature([Admin, Organization]),
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
            signOptions: { expiresIn: '1h' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule { }
