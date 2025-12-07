import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { RepositoryService } from '../common/repository/repository.service';
import { ModelType } from '../common/repository/type/model-type';
import Limit from './limit.model';

@Injectable()
export class LimitService extends RepositoryService<Limit> implements OnModuleInit {
    private readonly logger = new Logger(LimitService.name);

    constructor(
        @Inject('LIMITS_REPOSITORY')
        protected repository: ModelType<Limit>,
    ) {
        super(repository);
    }

    async onModuleInit() {
        const limit = await super.findAll();

        if (!limit.length) {
            await super.create({
                name: 'Лимит на продукты',
                icon: 'shopping',
                description: 'Ежемесячный лимит на продукты питания',
                limit: 10000,
                period: 'monthly',
                categories: ['Food', 'Shopping'],
                userId: 1,
            });
        }
    }
}
