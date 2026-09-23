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

// pg возвращает NUMERIC строкой (чтобы не терять точность) — приводим к number,
// т.к. сервис сравнивает molarConcentration/ph как обычные числа.
const numericTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value),
};

@Entity('solutions')
export class Solution {
  @PrimaryGeneratedColumn({ name: 'solution_id' })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 70 })
  substanceName: string;

  @Column({ name: 'formula', type: 'varchar', length: 20 })
  chemicalFormula: string;

  @Column({ name: 'electrolyte_type', type: 'varchar', length: 20 })
  electrolyteType: string;

  @Column({
    name: 'molar_concentration',
    type: 'numeric',
    precision: 5,
    scale: 3,
    transformer: numericTransformer,
  })
  molarConcentration: number;

  @Column({ name: 'ph', type: 'numeric', precision: 4, scale: 2, transformer: numericTransformer })
  ph: number;

  @Column({ name: 'description', type: 'varchar', length: 500 })
  description: string;

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
