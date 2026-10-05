import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Like } from './like.entity.js';
import { User } from './user.entity.js';

export type SolutionStatus = 'draft' | 'published' | 'deleted';

const numericTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : parseFloat(value)),
};

@Entity('solutions')
export class Solution {
  @PrimaryGeneratedColumn({ name: 'solution_id' })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 70 })
  substanceName: string;

  @Column({
    name: 'molar_concentration',
    type: 'numeric',
    precision: 5,
    scale: 3,
    nullable: true,
    transformer: numericTransformer,
  })
  molarConcentration: number | null;

  @Column({
    name: 'ph',
    type: 'numeric',
    precision: 4,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  ph: number | null;

  @Column({ name: 'description', type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'image', type: 'varchar', length: 255 })
  image: string;

  @Column({ name: 'video', type: 'varchar', length: 255 })
  video: string;

  @Column({ name: 'status', type: 'varchar', length: 10 })
  status: SolutionStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'creator_id', type: 'integer' })
  creatorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => Like, (like) => like.solution)
  likes: Like[];
}
