import { ConfigService } from '@nestjs/config';
import { Sequelize } from 'sequelize-typescript';

export const databaseProviders = [
    {
        provide: 'SEQUELIZE',
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => {
            const sequelize = new Sequelize({
                dialect: 'postgres',
                port: +configService.get('WIDGET_DB_PORT'),
                host: configService.get('WIDGET_DB_IP'),
                username: configService.get('WIDGET_DB_USER'),
                password: configService.get('WIDGET_DB_PASSWORD'),
                database: configService.get('WIDGET_DB_NAME'),
                logging: false,
                pool: {
                    max: 50,
                    min: 0,
                    acquire: 30000,
                    idle: 10000,
                },
                models: [],
            });
            return sequelize;
        },
    },
];
