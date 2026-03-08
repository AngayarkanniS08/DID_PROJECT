import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Student } from './student.entity';

@Entity()
export class Credential {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('simple-array')
    type: string[];

    @Column()
    issuanceDate: Date;

    @Column()
    expirationDate: Date;

    @Column('text')
    signature: string;

    @Column('json', { nullable: true })
    payload: any;

    @ManyToOne(() => Student, (student) => student.credentials)
    student: Student;
}
