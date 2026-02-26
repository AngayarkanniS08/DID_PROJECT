import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class SetupService {
    constructor(
        @InjectRepository(Organization)
        private orgRepository: Repository<Organization>,
    ) { }

    async getStatus(): Promise<{ isComplete: boolean }> {
        const count = await this.orgRepository.count();
        return { isComplete: count > 0 };
    }

    async createOrganization(data: Partial<Organization>): Promise<Organization> {
        const existing = await this.orgRepository.find();
        if (existing.length > 0) {
            throw new Error('Organization already set up');
        }
        const org = this.orgRepository.create(data);
        return this.orgRepository.save(org);
    }
}
