import { Controller, Get, Post, Body, Query, Logger, BadRequestException } from '@nestjs/common';
import { DigilockerService } from './digilocker.service';
import { Public } from '../auth/public.decorator';

@Controller('digilocker')
export class DigilockerController {
  private readonly logger = new Logger(DigilockerController.name);

  constructor(private readonly digilockerService: DigilockerService) {}

  @Public()
  @Get('auth-url')
  async getAuthUrl() {
    this.logger.log('Generating DigiLocker Auth URL...');
    const url = this.digilockerService.getAuthUrl();
    return { url };
  }

  @Public()
  @Post('callback')
  async handleCallback(@Body('code') code: string) {
    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }
    
    this.logger.log(`Received DigiLocker code: ${code.substring(0, 10)}...`);
    return await this.digilockerService.handleCallback(code);
  }
}
