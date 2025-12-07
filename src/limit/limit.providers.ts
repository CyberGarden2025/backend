import Limit from './limit.model';

export const limitsProviders = [
    {
        provide: 'LIMITS_REPOSITORY',
        useValue: Limit,
    },
];
