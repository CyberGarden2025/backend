import Transaction from './transaction.model';

export const transactionProviders = [
    {
        provide: 'TRANSACTION_REPOSITORY',
        useValue: Transaction,
    },
];
