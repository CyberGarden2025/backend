import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    DefaultScope,
} from 'sequelize-typescript';
import User from '../user/user.model';

@Table({
    tableName: 'transactions',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
})
export default class Transaction extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    })
    declare id: number;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false,
        field: 'transactionDate',
    })
    transactionDate: Date;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    category: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
        field: 'refNo',
    })
    refNo: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        get() {
            const value = this.getDataValue('withdrawal');
            return value ? parseFloat(value) : 0;
        },
    })
    withdrawal!: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        get() {
            const value = this.getDataValue('deposit');
            return value ? parseFloat(value) : 0;
        },
    })
    deposit: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        get() {
            const value = this.getDataValue('balance');
            return value ? parseFloat(value) : 0;
        },
    })
    balance: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'userId',
    })
    userId: number;

    @BelongsTo(() => User)
    user!: User;
}
