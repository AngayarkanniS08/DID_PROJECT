import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student, StudentStatus } from '../entities/student.entity';
import { Credential } from '../entities/credential.entity';
import { CreateStudentDto } from '../dto/create-student.dto';
import {
  KeyManager,
  Signer,
  Verifier,
  DIDGenerator,
  STUDENT_CREDENTIAL_SCHEMA,
} from '@secure-verify/did-core';
import { Wallet, HDNodeWallet } from 'ethers';
import * as crypto from 'crypto';
import { MailerService } from '../mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
import * as otpauth from 'otpauth';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);
  private issuerWallet: Wallet | HDNodeWallet;

  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Credential)
    private credentialsRepository: Repository<Credential>,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {
    const DEV_PRIVATE_KEY =
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    this.issuerWallet = new Wallet(DEV_PRIVATE_KEY);

    console.log('Issuer Address:', this.issuerWallet.address);
  }

  getIssuerAddress(): string {
    return this.issuerWallet.address;
  }

  async verifyCredential(payload: any) {
    const issuerAddress = this.getIssuerAddress();
    const result = Verifier.verifyIdentity(payload, issuerAddress);

    return {
      success: result.isValid,
      recoveredAddress: result.recoveredAddress,
      issuerAddress: issuerAddress,
      error: result.error,
    };
  }

  // ── THE BULK IMPORT ENGINE ──
  async bulkCreateStudents(studentDataArray: any[], organizationId: string) {
    try {
      this.logger.log(
        `Processing bulk import of ${studentDataArray.length} students for Org: ${organizationId}`,
      );

      // Step 1: Extract all incoming identifiers
      if (!studentDataArray || studentDataArray.length === 0) {
        return {
          totalReceived: 0,
          insertedCount: 0,
          skippedCount: 0,
          message: 'No data provided',
        };
      }

      this.logger.debug(
        `First row keys received: ${JSON.stringify(Object.keys(studentDataArray[0] || {}))}`,
      );

      const incomingRollNumbers = studentDataArray
        .map(
          (s) =>
            s.rollNumber ||
            s.RollNumber ||
            s['Roll Number'] ||
            s['Roll No'] ||
            s.RollNo ||
            s.rollno,
        )
        .filter(Boolean);

      const incomingEmails = studentDataArray
        .map(
          (s) =>
            s.email ||
            s.Email ||
            s.EmailAddress ||
            s['Email ID'] ||
            s['Email Id'],
        )
        .filter(Boolean);

      if (incomingRollNumbers.length === 0) {
        this.logger.error(
          'No valid roll numbers found after mapping. Check CSV headers!',
        );
        return {
          totalReceived: studentDataArray.length,
          insertedCount: 0,
          skippedCount: studentDataArray.length,
          error:
            'No valid roll numbers found. Please ensure headers are "name", "email", and "rollNumber".',
          receivedHeaders: Object.keys(studentDataArray[0]),
        };
      }

      // Step 2: Query DB for BOTH Roll Numbers and Emails (Prevent 500 crashes on unique constraints)
      const [existingRollsRecords, existingEmailsRecords] = await Promise.all([
        this.studentsRepository.find({
          where: { rollNumber: In(incomingRollNumbers), organizationId },
          select: ['rollNumber'],
        }),
        this.studentsRepository.find({
          where: { email: In(incomingEmails) },
          select: ['email'],
        }),
      ]);

      const existingRolls = new Set(
        existingRollsRecords.map((s) => s.rollNumber),
      );
      const existingEmails = new Set(existingEmailsRecords.map((s) => s.email));

      const newStudentsToInsert = [];
      let skippedRoll = 0;
      let skippedEmail = 0;
      let skippedIncomplete = 0;

      // Step 3: Loop through incoming data and filter out duplicates
      for (const [index, data] of studentDataArray.entries()) {
        // Extreme Normalization: Ensure we find the data regardless of header quirks
        const roll = String(
          data.rollNumber ||
            data.RollNumber ||
            data['rollNumber'] ||
            data['Roll Number'] ||
            data['Roll No'] ||
            data.RollNo ||
            data.rollno ||
            data['roll no'] ||
            data.id ||
            data.ID ||
            data.uid ||
            data.UID ||
            '',
        ).trim();

        const email = String(
          data.email ||
            data.Email ||
            data['email'] ||
            data.EmailAddress ||
            data['Email ID'] ||
            data['Email Id'] ||
            data['email id'] ||
            data.mail ||
            data.Mail ||
            '',
        ).trim();

        const name =
          data.name ||
          data.Name ||
          data['name'] ||
          data['Student Name'] ||
          data['StudentName'] ||
          data['student name'] ||
          data['Full Name'] ||
          data['fullname'] ||
          data.stu_name ||
          data.Name;

        const dept =
          data.department ||
          data.Department ||
          data.dept ||
          data.Dept ||
          data.department;

        // Log a sample for the first few rows to the server console if mapping fails
        if (index < 3 && (!roll || !email || !name)) {
          this.logger.warn(
            `Mapping Failure on Row ${index}. Raw Data: ${JSON.stringify(data)}`,
          );
        }

        if (
          !roll ||
          !email ||
          !name ||
          roll === 'undefined' ||
          email === 'undefined' ||
          roll === '' ||
          email === ''
        ) {
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

        // Step 4: THE KILL-SHOT (Generate Crypto Secret - Base32)
        const secretObj = new otpauth.Secret({ size: 20 });
        const uniqueTotpSecret = secretObj.base32;

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
        this.logger.log(
          `Successfully imported ${newStudentsToInsert.length} students.`,
        );
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
          headersDetected: Object.keys(studentDataArray[0] || {}),
        },
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
    // 2. Save the Student record first (Status: UNISSUED)
    const savedStudent = await this.studentsRepository.save(
      this.studentsRepository.create(createStudentDto),
    );
    // 3. Immediately Issue the Credential
    try {
      await this.issueCredential(savedStudent.id);
      // Refresh the student object to return the ACTIVE status
      return this.findOne(savedStudent.id);
    } catch (err) {
      console.error('Auto-issuance failed for student:', savedStudent.id, err);
      return savedStudent; // Return at least the student record
    }
  }

  async findAll(): Promise<Student[]> {
    return this.studentsRepository.find();
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({
      where: { id },
      relations: ['credentials'],
    });
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

    const vcPayload: any = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'StudentCredential'],
      issuer: DIDGenerator.generateDID(this.issuerWallet.address),
      issuanceDate: issuanceDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      credentialSubject: {
        id: student.did,
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email,
        department: student.department,
      },
    };

    const signature = await Signer.signObject(vcPayload, this.issuerWallet);
    vcPayload.sig = signature; // High-level signature for backward compatibility

    // Add standard proof block
    vcPayload.proof = {
      type: 'EthereumEip712Signature2021',
      proofPurpose: 'assertionMethod',
      verificationMethod: `${vcPayload.issuer}#controller`,
      created: issuanceDate.toISOString(),
      jws: signature,
    };

    const credential = this.credentialsRepository.create({
      type: ['StudentCredential'],
      issuanceDate,
      expirationDate,
      signature,
      payload: vcPayload,
      student,
    });

    // Update student status to ACTIVE
    student.status = StudentStatus.ACTIVE;
    await this.studentsRepository.save(student);

    return this.credentialsRepository.save(credential);
  }

  async sendCredentialEmail(
    studentId: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const student = await this.findOne(studentId);

      if (!student.email) {
        return { success: false, error: 'Student has no email address' };
      }

      if (student.status !== StudentStatus.ACTIVE) {
        return { success: false, error: 'Credential not yet issued' };
      }

      const appScheme = this.configService.get('APP_SCHEME') || 'mobile-wallet';

      const result = await this.mailerService.sendCredentialEmail({
        to: student.email,
        name: student.name,
        rollNumber: student.rollNumber,
        did: student.did,
        appScheme,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to send credential email to student ${studentId}`);
      this.logger.error(error instanceof Error ? error.stack : error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async batchSendEmails(ids: string[]): Promise<any> {
    this.logger.log(`Batch sending emails for ${ids.length} students`);

    const students = await this.studentsRepository.find({
      where: { id: In(ids), status: StudentStatus.ACTIVE },
    });

    const results = {
      total: ids.length,
      success: 0,
      failed: 0,
      noEmail: 0,
      notActive: ids.length - students.length,
    };

    const appScheme = this.configService.get('APP_SCHEME') || 'mobile-wallet';

    for (const student of students) {
      if (!student.email) {
        results.noEmail++;
        continue;
      }

      try {
        await this.mailerService.sendCredentialEmail({
          to: student.email,
          name: student.name,
          rollNumber: student.rollNumber,
          did: student.did,
          appScheme,
        });
        results.success++;
      } catch (err) {
        this.logger.error(
          `Failed to send email to student ${student.id}: ${err.message}`,
        );
        results.failed++;
      }
    }

    return results;
  }

  async revokeStudent(id: string): Promise<Student> {
    this.logger.log(`Revoking student ${id}`);
    const student = await this.findOne(id);
    student.status = StudentStatus.REVOKED;
    return this.studentsRepository.save(student);
  }

  async getStatus(did: string): Promise<{ did: string; status: StudentStatus }> {
    const student = await this.studentsRepository.findOne({ where: { did } });
    if (!student) {
      throw new NotFoundException(`Student with DID ${did} not found`);
    }
    return { did: student.did, status: student.status };
  }

  async batchIssueCredentials(ids: string[]): Promise<any> {
    this.logger.log(`Batch issuing credentials for ${ids.length} students`);

    const students = await this.studentsRepository.find({
      where: { id: In(ids) },
    });

    const results = {
      total: ids.length,
      success: 0,
      failed: 0,
      alreadyIssued: 0,
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
        const vcPayload: any = {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiableCredential', 'StudentCredential'],
          issuer: DIDGenerator.generateDID(this.issuerWallet.address),
          issuanceDate: issuanceDate.toISOString(),
          expirationDate: expirationDate.toISOString(),
          credentialSubject: {
            id: student.did,
            studentId: student.id,
            name: student.name,
            email: student.email,
            rollNumber: student.rollNumber,
          },
        };

        const signature = await Signer.signObject(vcPayload, this.issuerWallet);
        vcPayload.sig = signature;

        const credential = this.credentialsRepository.create({
          type: ['StudentCredential'],
          issuanceDate,
          expirationDate,
          signature,
          payload: vcPayload,
          student,
        });

        credentialsToSave.push(credential);
        student.status = StudentStatus.ACTIVE;
        studentsToUpdate.push(student);
        results.success++;
      } catch (err) {
        this.logger.error(
          `Failed to issue for student ${student.id}: ${err.message}`,
        );
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
