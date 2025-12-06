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
    transactionLimit?: number;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    fcmToken: string;

    @Column({
        type: DataType.FLOAT,
        allowNull: true,
        defaultValue: 0,
        field: 'financialCushion',
    })
    financialCushion: number;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        defaultValue: {},
        field: 'categoryLimits',
    })
    categoryLimits: Record<string, number>;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        defaultValue: {},
        field: 'notificationSettings',
    })
    notificationSettings: {
        categoryLimitWarning: boolean;
        financialCushionWarning: boolean;
        anomalousTransactionAlert: boolean;
        monthlyReport: boolean;
    };

    @HasMany(() => Transaction)
    transactions: Transaction[];
}
