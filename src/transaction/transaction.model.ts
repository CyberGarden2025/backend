import { Table, Column, Model, DataType } from 'sequelize-typescript';

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
    declare transactionDate: Date;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare category: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
        field: 'refNo',
    })
    declare refNo: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        get() {
            const value = this.getDataValue('withdrawal');
            return value ? parseFloat(value) : 0;
        },
    })
    declare withdrawal: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        get() {
            const value = this.getDataValue('deposit');
            return value ? parseFloat(value) : 0;
        },
    })
    declare deposit: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        get() {
            const value = this.getDataValue('balance');
            return value ? parseFloat(value) : 0;
        },
    })
    declare balance: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        field: 'userId',
    })
    declare userId: string;
}
