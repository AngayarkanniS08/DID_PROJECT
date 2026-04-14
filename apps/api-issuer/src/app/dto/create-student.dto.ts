import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateStudentDto {
    @IsString()
    did?: string;

    @IsString()
    @IsNotEmpty()
    rollNumber: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    department?: string;

    @IsString()
    organizationId: string;

    @IsString()
    totpSecret?: string;
}
