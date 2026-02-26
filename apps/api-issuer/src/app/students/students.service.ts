import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student, StudentStatus } from '../entities/student.entity';
import { Credential } from '../entities/credential.entity';
import { CreateStudentDto } from '../dto/create-student.dto';
import { KeyManager, Signer, DIDGenerator, STUDENT_CREDENTIAL_SCHEMA } from '@secure-verify/did-core';
import { Wallet, HDNodeWallet } from 'ethers';
import * as crypto from 'crypto';

@Injectable()
export class StudentsService {
    private readonly logger = new Logger(StudentsService.name);
    private issuerWallet: Wallet | HDNodeWallet;

    constructor(
        @InjectRepository(Student)
        private studentsRepository: Repository<Student>,
        @InjectRepository(Credential)
        private credentialsRepository: Repository<Credential>,
    ) {
        this.issuerWallet = KeyManager.generateWallet();
        console.log('Issuer Private Key:', this.issuerWallet.privateKey);
    }

    // ── THE BULK IMPORT ENGINE ──
    async bulkCreateStudents(studentDataArray: any[], organizationId: string) {
        try {
            this.logger.log(`Processing bulk import of ${studentDataArray.length} students for Org: ${organizationId}`);

            // Step 1: Extract all incoming identifiers
            if (!studentDataArray || studentDataArray.length === 0) {
                return { totalReceived: 0, insertedCount: 0, skippedCount: 0, message: 'No data provided' };
            }

            this.logger.debug(`First row keys received: ${JSON.stringify(Object.keys(studentDataArray[0] || {}))}`);

            const incomingRollNumbers = studentDataArray
                .map(s => s.rollNumber || s.RollNumber || s['Roll Number'] || s['Roll No'] || s.RollNo || s.rollno)
                .filter(Boolean);

            const incomingEmails = studentDataArray
                .map(s => s.email || s.Email || s.EmailAddress || s['Email ID'] || s['Email Id'])
                .filter(Boolean);

            if (incomingRollNumbers.length === 0) {
                this.logger.error('No valid roll numbers found after mapping. Check CSV headers!');
                return {
                    totalReceived: studentDataArray.length,
                    insertedCount: 0,
                    skippedCount: studentDataArray.length,
                    error: 'No valid roll numbers found. Please ensure headers are "name", "email", and "rollNumber".',
                    receivedHeaders: Object.keys(studentDataArray[0])
                };
            }

            // Step 2: Query DB for BOTH Roll Numbers and Emails (Prevent 500 crashes on unique constraints)
            const [existingRollsRecords, existingEmailsRecords] = await Promise.all([
                this.studentsRepository.find({ where: { rollNumber: In(incomingRollNumbers), organizationId }, select: ['rollNumber'] }),
                this.studentsRepository.find({ where: { email: In(incomingEmails) }, select: ['email'] })
            ]);

            const existingRolls = new Set(existingRollsRecords.map(s => s.rollNumber));
            const existingEmails = new Set(existingEmailsRecords.map(s => s.email));

            const newStudentsToInsert = [];
            let skippedRoll = 0;
            let skippedEmail = 0;
            let skippedIncomplete = 0;

            // Step 3: Loop through incoming data and filter out duplicates
            for (const [index, data] of studentDataArray.entries()) {
                // Extreme Normalization: Ensure we find the data regardless of header quirks
                const roll = String(
                    data.rollNumber || data.RollNumber || data['rollNumber'] ||
                    data['Roll Number'] || data['Roll No'] || data.RollNo ||
                    data.rollno || data['roll no'] || data.id || data.ID || data.uid || data.UID || ''
                ).trim();

                const email = String(
                    data.email || data.Email || data['email'] ||
                    data.EmailAddress || data['Email ID'] || data['Email Id'] ||
                    data['email id'] || data.mail || data.Mail || ''
                ).trim();

                const name = data.name || data.Name || data['name'] ||
                    data['Student Name'] || data['StudentName'] ||
                    data['student name'] || data['Full Name'] || data['fullname'] ||
                    data.stu_name || data.Name;

                const dept = data.department || data.Department || data.dept || data.Dept || data.department;

                // Log a sample for the first few rows to the server console if mapping fails
                if (index < 3 && (!roll || !email || !name)) {
                    this.logger.warn(`Mapping Failure on Row ${index}. Raw Data: ${JSON.stringify(data)}`);
                }

                if (!roll || !email || !name || roll === 'undefined' || email === 'undefined' || roll === '' || email === '') {
                    skippedIncomplete++;
                    continue; // Skip incomplete or clearly invalid rows
                }

                if (existingRolls.has(roll)) {
                    skippedRoll++;
                    continue;
                }

                if (existingEmails.has(email)) {
                    skippedEmail++;
                    continue;
                }

                // Step 4: THE KILL-SHOT (Generate Crypto Secret)
                const uniqueTotpSecret = crypto.randomBytes(20).toString('hex');

                // Generate DID for the student
                const studentWallet = KeyManager.generateWallet();
                const studentDid = DIDGenerator.generateDID(studentWallet.address);

                // Step 5: Assemble the final student object
                const newStudent = this.studentsRepository.create({
                    name,
                    rollNumber: roll,
                    email,
                    department: dept,
                    did: studentDid,
                    organizationId,
                    totpSecret: uniqueTotpSecret,
                });

                newStudentsToInsert.push(newStudent);
                // Track locally to prevent duplicates within the same batch
                existingRolls.add(roll);
                existingEmails.add(email);
            }

            // Step 6: Bulk Insert into PostgreSQL
            if (newStudentsToInsert.length > 0) {
                await this.studentsRepository.save(newStudentsToInsert);
                this.logger.log(`Successfully imported ${newStudentsToInsert.length} students.`);
            }

            // Step 7: Return Detailed Report
            return {
                totalReceived: studentDataArray.length,
                insertedCount: newStudentsToInsert.length,
                duplicateRollNumbers: skippedRoll,
                duplicateEmails: skippedEmail,
                incompleteRows: skippedIncomplete,
                skippedCount: skippedRoll + skippedEmail + skippedIncomplete,
                debugSample: {
                    received: studentDataArray[0],
                    headersDetected: Object.keys(studentDataArray[0] || {})
                }
            };
        } catch (error) {
            this.logger.error(`CRITICAL IMPORT ERROR: ${error.message}`, error.stack);
            throw new Error(`Bulk import failed: ${error.message}`);
        }
    }

    async create(createStudentDto: CreateStudentDto): Promise<Student> {
        // Ensure DID is generated even for single creation if not provided
        if (!createStudentDto.did) {
            const studentWallet = KeyManager.generateWallet();
            createStudentDto.did = DIDGenerator.generateDID(studentWallet.address);
        }
        if (!createStudentDto.totpSecret) {
            createStudentDto.totpSecret = crypto.randomBytes(20).toString('hex');
        }
        const student = this.studentsRepository.create(createStudentDto);
        return this.studentsRepository.save(student);
    }

    async findAll(): Promise<Student[]> {
        return this.studentsRepository.find();
    }

    async findOne(id: string): Promise<Student> {
        const student = await this.studentsRepository.findOne({ where: { id }, relations: ['credentials'] });
        if (!student) {
            throw new NotFoundException(`Student with ID ${id} not found`);
        }
        return student;
    }

    async issueCredential(id: string): Promise<Credential> {
        const student = await this.findOne(id);

        const issuanceDate = new Date();
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        const vcPayload = {
            sub: student.did,
            iss: DIDGenerator.generateDID(this.issuerWallet.address),
            nbf: Math.floor(issuanceDate.getTime() / 1000),
            exp: Math.floor(expirationDate.getTime() / 1000),
            vc: {
                '@context': STUDENT_CREDENTIAL_SCHEMA['@context'],
                type: ['VerifiableCredential', 'StudentCredential'],
                credentialSubject: {
                    id: student.did,
                    studentId: student.id,
                    name: student.name,
                    email: student.email,
                }
            }
        };

        const signature = await Signer.signObject(vcPayload, this.issuerWallet);

        const credential = this.credentialsRepository.create({
            type: ['StudentCredential'],
            issuanceDate,
            expirationDate,
            signature,
            student
        });

        // Update student status to ACTIVE
        student.status = StudentStatus.ACTIVE;
        await this.studentsRepository.save(student);

        return this.credentialsRepository.save(credential);
    }

    async batchIssueCredentials(ids: string[]): Promise<any> {
        this.logger.log(`Batch issuing credentials for ${ids.length} students`);

        const students = await this.studentsRepository.find({
            where: { id: In(ids) }
        });

        const results = {
            total: ids.length,
            success: 0,
            failed: 0,
            alreadyIssued: 0
        };

        const credentialsToSave = [];
        const studentsToUpdate = [];

        const issuanceDate = new Date();
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        for (const student of students) {
            if (student.status === StudentStatus.ACTIVE) {
                results.alreadyIssued++;
                continue;
            }

            try {
                const vcPayload = {
                    sub: student.did,
                    iss: DIDGenerator.generateDID(this.issuerWallet.address),
                    nbf: Math.floor(issuanceDate.getTime() / 1000),
                    exp: Math.floor(expirationDate.getTime() / 1000),
                    vc: {
                        '@context': STUDENT_CREDENTIAL_SCHEMA['@context'],
                        type: ['VerifiableCredential', 'StudentCredential'],
                        credentialSubject: {
                            id: student.did,
                            studentId: student.id,
                            name: student.name,
                            email: student.email,
                        }
                    }
                };

                const signature = await Signer.signObject(vcPayload, this.issuerWallet);

                const credential = this.credentialsRepository.create({
                    type: ['StudentCredential'],
                    issuanceDate,
                    expirationDate,
                    signature,
                    student
                });

                credentialsToSave.push(credential);
                student.status = StudentStatus.ACTIVE;
                studentsToUpdate.push(student);
                results.success++;
            } catch (err) {
                this.logger.error(`Failed to issue for student ${student.id}: ${err.message}`);
                results.failed++;
            }
        }

        // Save in batches
        if (credentialsToSave.length > 0) {
            await this.credentialsRepository.save(credentialsToSave);
            await this.studentsRepository.save(studentsToUpdate);
        }

        return results;
    }
}
