import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { Student } from '../entities/student.entity';
import { Credential } from '../entities/credential.entity';

@Controller('students')
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

    @Get('health')
    healthCheck() {
        return { status: 'Students Controller is alive' };
    }

    @Post('upload')
    async bulkImport(@Body() body: { students: any[], organizationId: string }) {
        const { students, organizationId } = body;

        // Step 1: Basic Bouncer Check (Validation)
        if (!organizationId) {
            throw new HttpException('Organization ID is missing', HttpStatus.BAD_REQUEST);
        }
        if (!students || !Array.isArray(students) || students.length === 0) {
            throw new HttpException('No student data provided or invalid format', HttpStatus.BAD_REQUEST);
        }

        // Step 2: Hand over to the Brain (Service)
        const report = await this.studentsService.bulkCreateStudents(students, organizationId);

        // Step 3: Return the response to React Dashboard
        return {
            success: true,
            message: 'Bulk import processed successfully',
            data: report,
        };
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
            throw new HttpException('Student IDs must be provided as an array', HttpStatus.BAD_REQUEST);
        }
        return this.studentsService.batchIssueCredentials(body.ids);
    }

    @Post(':id/issue')
    issueCredential(@Param('id') id: string): Promise<Credential> {
        return this.studentsService.issueCredential(id);
    }
}
