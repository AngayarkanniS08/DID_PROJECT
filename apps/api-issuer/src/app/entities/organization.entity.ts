import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    shortCode: string;

    @Column({ nullable: true })
    website: string;

    @Column('simple-array', { nullable: true })
    departments: string[];

    @Column('simple-array', { nullable: true })
    roles: string[];

    @Column('simple-array', { nullable: true })
    accessZones: string[];

    @Column({ nullable: true })
    validity: string;

    @Column({ default: true })
    autoRevoke: boolean;

    @Column({ default: true })
    qrWatermark: boolean;

    @Column({ default: true })
    expiryNotify: boolean;

    @Column('simple-array', { nullable: true })
    staffVerifierRoles: string[];

    @Column({ default: 'csv' })
    importMethod: string;

    @Column({ default: true })
    isSetupComplete: boolean;
}
