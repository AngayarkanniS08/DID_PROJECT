import { Entity, Column, PrimaryGeneratedColumn, OneToMany, Index } from 'typeorm';
import { Credential } from './credential.entity';

export enum StudentStatus {
    UNISSUED = 'UNISSUED',
    ACTIVE = 'ACTIVE',
    REVOKED = 'REVOKED',
}

@Entity()
export class Student {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    @Index()
    did: string;

    @Column({ unique: true })
    rollNumber: string;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    department: string;

    @Column()
    organizationId: string;

    @Column()
    totpSecret: string;

    @Column({
        type: 'enum',
        enum: StudentStatus,
        default: StudentStatus.UNISSUED,
    })
    status: StudentStatus;

    @OneToMany(() => Credential, (credential) => credential.student)
    credentials: Credential[];
}
