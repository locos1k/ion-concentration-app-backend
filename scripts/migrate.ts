import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Like } from '../src/solutions/entities/like.entity.js';
import { Solution } from '../src/solutions/entities/solution.entity.js';
import { User } from '../src/solutions/entities/user.entity.js';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [Solution, User, Like],
  synchronize: true,
});

async function run() {
  await dataSource.initialize();
  await dataSource.synchronize();
  console.log('Миграции выполнены успешно.');
  await dataSource.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('Ошибка миграций:', err);
  process.exit(1);
});
