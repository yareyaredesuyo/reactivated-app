import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Repository } from '../repository/repository.entity';

export type Status = 'pending' | 'done' | 'merged' | 'closed' | 'error';

@Entity()
export class PullRequest {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'Id of the object',
    readOnly: true,
  })
  id: number;

  @ApiProperty()
  @Column()
  status: Status;

  @ApiProperty()
  @ManyToOne(() => Repository, (repository) => repository.pullRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @ApiProperty()
  @Column({ unique: true })
  branchName: string;

  @ApiProperty()
  @Column({ nullable: true })
  url: string;
}
