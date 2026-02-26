import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from '../entities/admin.entity';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Admin)
        private adminRepository: Repository<Admin>,
        @InjectRepository(Organization)
        private organizationRepository: Repository<Organization>,
        private jwtService: JwtService
    ) { }

    async signIn(email: string, pass: string): Promise<{ access_token: string; isSetupComplete: boolean }> {
        const admin = await this.adminRepository.findOne({ where: { email } });

        if (!admin) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordMatching = await bcrypt.compare(pass, admin.passwordHash);

        if (!isPasswordMatching) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if any organization has completed setup
        const org = await this.organizationRepository.findOne({ where: { isSetupComplete: true } });

        const payload = { sub: admin.id, email: admin.email };
        return {
            access_token: await this.jwtService.signAsync(payload),
            isSetupComplete: !!org,
        };
    }

    // 🚨 TEMPORARY: Delete this after first admin is created!
    async seedInitialAdmin() {
        const existingAdmin = await this.adminRepository.find();
        if (existingAdmin.length > 0) {
            return { message: 'Admin already exists!' };
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);

        const newAdmin = this.adminRepository.create({
            email: 'admin@secureverify.com',
            passwordHash: hashedPassword,
        });

        await this.adminRepository.save(newAdmin);
        return { message: 'Super Admin created!', email: newAdmin.email };
    }
}