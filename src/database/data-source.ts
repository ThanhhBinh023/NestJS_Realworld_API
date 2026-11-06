import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../modules/users/entities/user.entity.js';
import { Follow } from '../modules/profiles/entities/follow.entity.js';
import { Article } from '../modules/articles/entities/article.entity.js';
import { Tag } from '../modules/tags/entities/tag.entity.js';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'realworld_nest',
  entities: [User, Follow, Article, Tag],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  logging: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
