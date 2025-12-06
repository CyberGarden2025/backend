import Transaction from './transaction.model';

export const transactionProviders = [
    {
        provide: 'TRANSACTIONS_REPOSITORY',
        useValue: Transaction,
    },
];
