import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
    Attributes,
    BulkCreateOptions,
    CreateOptions,
    CreationAttributes,
    DestroyOptions,
    FindAndCountOptions,
    FindOptions,
    FindOrCreateOptions,
    Op,
    Order,
    OrderItem,
    UpdateOptions,
    WhereOptions,
} from 'sequelize';
import { Model } from 'sequelize-typescript';

@Injectable()
export abstract class RepositoryService<T extends Model> {
    protected readonly repository: typeof Model & (new () => T);
    protected readonly primaryKey: string = 'id';
    protected readonly uniqueFields: string[] = [];

    constructor(repository: typeof Model & (new () => T)) {
        this.repository = repository;
    }

    public async create(
        payload: CreationAttributes<T>,
        options?: CreateOptions<Attributes<T>>,
    ): Promise<T> {
        // Проверяем уникальность полей только если они указаны
        if (this.uniqueFields.length > 0) {
            const fieldsToCheck = this.uniqueFields.filter(field => payload[field] !== undefined);

            if (fieldsToCheck.length > 0) {
                const where: WhereOptions = {
                    [Op.or]: fieldsToCheck.map(field => ({
                        [field]: payload[field],
                    })),
                };

                const existing = await this.repository.findOne({ where });

                if (existing) {
                    // Находим конкретные поля с конфликтами
                    const conflicts: string[] = [];
                    fieldsToCheck.forEach(field => {
                        if (existing[field] === payload[field]) {
                            conflicts.push(field);
                        }
                    });

                    throw new ConflictException({
                        message: 'Unique constraint violation',
                        conflicts,
                    });
                }
            }
        }

        try {
            return await this.repository.create(payload, options);
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                const conflicts = error.errors.reduce((acc, err) => {
                    acc[err.path] = {
                        value: payload[err.path],
                        message: err.message,
                        validatorKey: err.validatorKey,
                    };
                    return acc;
                }, {});

                throw new ConflictException({
                    message: 'Database unique constraint violation',
                    conflicts,
                });
            }
            throw error;
        }
    }

    public async update(
        modelOrId: T | number | string,
        payload: Partial<CreationAttributes<T>>,
        options?: Omit<UpdateOptions<Attributes<T>>, 'where' | 'returning'>,
    ): Promise<T> {
        const id = this._getId(modelOrId);

        const [affectedCount] = await this.repository.update(payload, {
            ...options,
            where: { [this.primaryKey]: id } as WhereOptions<Attributes<T>>,
        });

        if (affectedCount === 0) {
            this.throwNotFoundException();
        }

        return this.findById(id, { transaction: options?.transaction });
    }

    public async delete(
        modelOrId: T | number | string,
        options?: DestroyOptions<Attributes<T>>,
    ): Promise<void> {
        if (typeof modelOrId === 'number' || typeof modelOrId === 'string') {
            const whereCondition: any = {
                [this.primaryKey]: modelOrId as any,
            };

            const deletedCount = await this.repository.destroy({
                where: whereCondition,
                ...options,
            });

            if (deletedCount === 0) this.throwNotFoundException();
            return;
        }

        if (modelOrId instanceof Model) {
            await modelOrId.destroy(options);
            return;
        }

        this.throwNotFoundException();
    }

    public async bulkCreate(
        records: ReadonlyArray<CreationAttributes<T>>,
        options?: BulkCreateOptions<Attributes<T>>,
    ): Promise<T[]> {
        return this.repository.bulkCreate(records, options);
    }

    public async findById(
        id: number | string,
        options?: Omit<FindOptions<Attributes<T>>, 'where'>,
    ): Promise<T> {
        const model = await this.repository.findOne({
            ...options,
            where: { [this.primaryKey]: id } as WhereOptions<Attributes<T>>,
        });

        if (!model) {
            this.throwNotFoundException();
        }

        return this.toPlain(model);
    }

    public async findAll(options?: FindOptions<Attributes<T>>): Promise<any[]> {
        const models = await this.repository.findAll(options);
        return this.toPlain(models);
    }

    public async findOne(options?: FindOptions<Attributes<T>>): Promise<any> {
        const model = await this.repository.findOne(options);

        if (!model) {
            this.throwNotFoundException();
        }

        return this.toPlain(model);
    }

    public async findOrCreate(
        options: FindOrCreateOptions<Attributes<T>, CreationAttributes<T>>,
    ): Promise<[T, boolean]> {
        return this.repository.findOrCreate(options);
    }

    public async count(options?: Omit<FindOptions<Attributes<T>>, 'attributes'>): Promise<number> {
        return this.repository.count(options);
    }

    private _getId(modelOrId: T | number | string): number | string {
        return typeof modelOrId === 'object' ? (modelOrId as any)[this.primaryKey] : modelOrId;
    }

    public async getByModelOrId(
        modelOrId: T | number | string,
        options?: Omit<FindOptions<Attributes<T>>, 'where'>,
    ): Promise<T> {
        if (typeof modelOrId === 'number' || typeof modelOrId === 'string') {
            const model = await this.repository.findByPk(modelOrId, options);
            if (!model) this.throwNotFoundException();
            return model as T;
        }

        if (!modelOrId) this.throwNotFoundException();

        return modelOrId as T;
    }

    public throwNotFoundException(): never {
        throw new NotFoundException(`${this.repository.name || 'Entity'} not found`);
    }

    public async destroy(
        where: WhereOptions<Attributes<T>>,
        options?: Omit<DestroyOptions<Attributes<T>>, 'where'>,
    ): Promise<number> {
        const deletedCount = await this.repository.destroy({
            ...options,
            where,
        });

        if (deletedCount === 0) {
            this.throwNotFoundException();
        }

        return deletedCount;
    }

    public async findAndCountAll(
        options: FindAndCountOptions<T>,
    ): Promise<{ rows: T[]; count: number }> {
        let order: Order | undefined = undefined;

        if (options.order) {
            if (Array.isArray(options.order)) {
                if (options.order.length > 0 && Array.isArray(options.order[0])) {
                    order = (options.order as OrderItem[]).map(item => {
                        if (Array.isArray(item)) {
                            const [col, dir] = item;
                            if (typeof col === 'string' && (dir === 'ASC' || dir === 'DESC')) {
                                return [col, dir] as [string, 'ASC' | 'DESC'];
                            }
                            throw new Error('Invalid order item format');
                        }
                        return item;
                    });
                } else {
                    order = options.order as Order;
                }
            } else {
                order = options.order;
            }
        }

        const newOptions = {
            ...options,
            order,
        };

        return this.repository.findAndCountAll(newOptions);
    }

    protected toPlain<T>(data: T | T[]): any {
        if (Array.isArray(data)) {
            return data.map(item => this.toPlain(item));
        }
        // Если есть метод toJSON, вызываем его, иначе возвращаем объект как есть
        if (data && typeof (data as any).toJSON === 'function') {
            return (data as any).toJSON();
        }
        return data;
    }

    public async checkUniqueConstraints(
        payload: Partial<CreationAttributes<T>>,
        excludeId?: number | string,
    ): Promise<{ conflicts: Record<string, any> }> {
        const conflicts: Record<string, any> = {};

        for (const field of this.uniqueFields) {
            if (payload[field] !== undefined) {
                const where: WhereOptions = { [field]: payload[field] };

                if (excludeId) {
                    where[this.primaryKey] = { [Op.ne]: excludeId };
                }

                const existing = await this.repository.findOne({ where });
                if (existing) {
                    conflicts[field] = {
                        value: payload[field],
                        message: `${field} already exists`,
                        existingId: existing[this.primaryKey],
                    };
                }
            }
        }

        return { conflicts };
    }

    public async findByUniqueField(
        field: string,
        value: any,
        options?: Omit<FindOptions<Attributes<T>>, 'where'>,
    ): Promise<T | null> {
        if (!this.uniqueFields.includes(field)) {
            throw new Error(`Field ${field} is not marked as unique`);
        }

        return this.repository.findOne({
            ...options,
            where: { [field]: value } as WhereOptions<Attributes<T>>,
        });
    }
}
