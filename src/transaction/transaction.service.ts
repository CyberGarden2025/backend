import { Inject, Injectable, Logger } from '@nestjs/common';

import { RepositoryService } from '../common/repository/repository.service';
import { ModelType } from '../common/repository/type/model-type';
import Transaction from './transaction.model';

@Injectable()
export class TransactionService extends RepositoryService<Transaction> {
    private readonly logger = new Logger(TransactionService.name);

    constructor(
        @Inject('TRANSACTION_REPOSITORY')
        protected repository: ModelType<Transaction>,
    ) {
        super(repository);
    }
}
