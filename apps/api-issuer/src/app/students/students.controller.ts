import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
  UploadedFile,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { Student } from '../entities/student.entity';
import { Credential } from '../entities/credential.entity';
// apps/api-issuer/src/app/students/students.controller.ts
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/Jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  private readonly logger = new Logger(StudentsController.name);

  constructor(private readonly studentsService: StudentsService) {}

  @Get('health')
  healthCheck() {
    return { status: 'Students Controller is alive' };
  }

  @Get('config/issuer')
  getIssuerConfig() {
    return { address: this.studentsService.getIssuerAddress() };
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  async bulkImport(@Body() body: { students: any[]; organizationId: string }) {
    try {
      const { students, organizationId } = body;

      // Step 1: Basic Bouncer Check (Validation)
      if (!organizationId) {
        return {
          success: false,
          message: 'Organization ID is missing',
        };
      }
      if (!students || !Array.isArray(students)) {
        return {
          success: false,
          message: 'No student data provided or invalid format',
        };
      }

      // Step 2: Hand over to the Brain (Service)
      const report = await this.studentsService.bulkCreateStudents(
        students,
        organizationId,
      );

      // Step 3: Return the response to React Dashboard
      return {
        success: true,
        message: 'Bulk import processed successfully',
        data: report,
      };
    } catch (err: any) {
      this.logger.error(`Bulk import failed: ${err.message}`, err.stack);
      return {
        success: false,
        message: `Backend Error: ${err.message}`,
      };
    }
  }

  @Post()
  create(@Body() createStudentDto: CreateStudentDto): Promise<Student> {
    return this.studentsService.create(createStudentDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Student> {
    return this.studentsService.findOne(id);
  }

  @Get()
  findAll(): Promise<Student[]> {
    return this.studentsService.findAll();
  }

  @Post('batch-issue')
  async batchIssue(@Body() body: { ids: string[] }) {
    if (!body.ids || !Array.isArray(body.ids)) {
      throw new HttpException(
        'Student IDs must be provided as an array',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.studentsService.batchIssueCredentials(body.ids);
  }

  @Post(':id/issue')
  issueCredential(@Param('id') id: string): Promise<Credential> {
    return this.studentsService.issueCredential(id);
  }

  @Post(':id/send-email')
  async sendCredentialEmail(@Param('id') id: string) {
    return this.studentsService.sendCredentialEmail(id);
  }

  @Public()
  @Post('verify')
  async verify(@Body() payload: any) {
    return this.studentsService.verifyCredential(payload);
  }
}
