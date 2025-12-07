import User from './user.model';

export const userProviders = [
    {
        provide: 'USERS_REPOSITORY',
        useValue: User,
    },
];
