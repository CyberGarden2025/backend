import { ConfigService } from '@nestjs/config';
import { Sequelize } from 'sequelize-typescript';
import Transaction from '../transaction/transaction.model';
import User from 'src/user/user.model';
import Limit from 'src/limit/limit.model';

export const databaseProviders = [
    {
        provide: 'SEQUELIZE',
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => {
            const sequelize = new Sequelize({
                dialect: 'postgres',
                port: +configService.get('DB_PORT'),
                host: configService.get('DB_IP'),
                username: configService.get('DB_USER'),
                password: configService.get('DB_PASSWORD'),
                database: configService.get('DB_NAME'),
                logging: false,
                pool: {
                    max: 50,
                    min: 0,
                    acquire: 30000,
                    idle: 10000,
                },
                models: [Transaction, User, Limit],
            });
            return sequelize;
        },
    },
];
