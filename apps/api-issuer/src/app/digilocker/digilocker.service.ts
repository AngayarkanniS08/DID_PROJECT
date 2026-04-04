import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { StudentsService } from '../students/students.service';

@Injectable()
export class DigilockerService {
  private readonly logger = new Logger(DigilockerService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly authEndpoint = 'https://digitallocker.gov.in/public/oauth2/1/authorize';
  private readonly tokenEndpoint = 'https://digitallocker.gov.in/public/oauth2/1/token';
  private readonly profileEndpoint = 'https://digitallocker.gov.in/public/oauth2/1/user';

  constructor(
    private configService: ConfigService,
    private studentsService: StudentsService,
  ) {
    this.clientId = this.configService.get<string>('DIGILOCKER_CLIENT_ID') || 'TEST_CLIENT_ID';
    this.clientSecret = this.configService.get<string>('DIGILOCKER_CLIENT_SECRET') || 'TEST_CLIENT_SECRET';
    this.redirectUri = this.configService.get<string>('DIGILOCKER_REDIRECT_URI') || 'mobile-wallet://digilocker-callback';
  }

  getAuthUrl() {
    const state = Math.random().toString(36).substring(7);
    return `${this.authEndpoint}?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      this.redirectUri,
    )}&state=${state}`;
  }

  async handleCallback(code: string) {
    try {
      this.logger.log(`Exchanging code for token with DigiLocker...`);
      
      const tokenResponse = await axios.post(
        this.tokenEndpoint,
        new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const { access_token } = tokenResponse.data;
      this.logger.log(`Token received. Fetching user profile...`);

      const profileResponse = await axios.get(this.profileEndpoint, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const profile = profileResponse.data;
      this.logger.log(`Profile fetched for: ${profile.name}`);

      // Linking logic: Find student by email or Aadhaar (if available in profile)
      // For this demo, we'll try to find by email and then issue the credential
      return await this.identifyAndIssue(profile);
    } catch (error) {
      this.logger.error(`DigiLocker callback failed: ${error.message}`);
      if (error.response) {
        this.logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  private async identifyAndIssue(profile: any) {
    // DigiLocker profile usually contains 'name' and 'email' or 'mobile'
    const students = await this.studentsService.findAll();
    
    // Simple heuristic: search by name matching
    // In production, you'd use a more robust identifier like Aadhaar hash or verified email
    const student = students.find(
      (s) => s.name.toLowerCase() === profile.name.toLowerCase() || s.email === profile.email
    );

    if (!student) {
      this.logger.warn(`No matching student found for profile: ${profile.name}`);
      throw new ConflictException(`Identity verified via DigiLocker, but no matching student record found in SecureVerify.`);
    }

    this.logger.log(`Matching student found: ${student.rollNumber}. Issuing DID...`);
    const credential = await this.studentsService.issueCredential(student.id);
    
    return {
      success: true,
      studentName: student.name,
      rollNumber: student.rollNumber,
      did: student.did,
      credential,
    };
  }
}
