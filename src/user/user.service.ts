import { Inject, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import User from './user.model';
import { RepositoryService } from '../common/repository/repository.service';
import { ModelType } from '../common/repository/type/model-type';
import { UserCreatePayload } from './payload/user-create.pay,oad';

@Injectable()
export class UserService extends RepositoryService<User> {
    private readonly logger = new Logger(UserService.name);

    constructor(
        @Inject('USERS_REPOSITORY')
        protected repository: ModelType<User>,
    ) {
        super(repository);
    }

    async createUser(payload: UserCreatePayload) {
        const hashedPassword = await this.hashPassword(payload.password);

        return super.create({
            ...payload,
            password: hashedPassword,
        });
    }
    private async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }
}
