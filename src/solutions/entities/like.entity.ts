import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Solution } from './solution.entity.js';
import { User } from './user.entity.js';

@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn({ name: 'like_id' })
  id: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ name: 'solution_id', type: 'integer' })
  solutionId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Solution, (solution) => solution.likes)
  @JoinColumn({ name: 'solution_id' })
  solution: Solution;
}
