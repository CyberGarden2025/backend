import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import Transaction from '../transaction/transaction.model';

@Table({
    tableName: 'users',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
})
export default class User extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    })
    declare id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    })
    email: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        unique: true,
    })
    username: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    password: string;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
        defaultValue: 0,
    })
    balance: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: true,
    })
    transactionLimit?: string;

    @Column({
        type: DataType.STRING,

        allowNull: true,
    })
    fcmToken: string;

    @Column({
        type: DataType.FLOAT,
        allowNull: true,
    })
    financialCushion: number;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    categoryLimits: object;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    notificationSettings: object;

    @HasMany(() => Transaction)
    transactions: Transaction[];
}
