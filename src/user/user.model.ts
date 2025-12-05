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

    @HasMany(() => Transaction)
    transactions: Transaction[];
}
