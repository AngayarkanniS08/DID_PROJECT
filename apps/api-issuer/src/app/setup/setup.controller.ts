import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { SetupService } from './setup.service';
import { Organization } from '../entities/organization.entity';

@Controller('setup')
export class SetupController {
    constructor(private readonly setupService: SetupService) { }

    @Get('status')
    async getStatus() {
        return this.setupService.getStatus();
    }

    @Post()
    async completeSetup(@Body() body: Partial<Organization>) {
        try {
            return await this.setupService.createOrganization(body);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}
