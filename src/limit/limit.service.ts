import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { RepositoryService } from '../common/repository/repository.service';
import { ModelType } from '../common/repository/type/model-type';
import Limit from './limit.model';

@Injectable()
export class LimitService extends RepositoryService<Limit> {
    private readonly logger = new Logger(LimitService.name);

    constructor(
        @Inject('LIMITS_REPOSITORY')
        protected repository: ModelType<Limit>,
    ) {
        super(repository);
    }
}
