import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import User from 'src/user/user.model';

@Table({
    tableName: 'limits',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
})
export default class Limit extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    declare name: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare icon: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare description: string;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    declare limit: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: true,
    })
    declare spent: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
    })
    declare period: string;

    @Column({
        type: DataType.JSON,
        allowNull: false,
        defaultValue: [],
    })
    declare categories: string[];

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'userId',
    })
    declare userId: number;

    @BelongsTo(() => User)
    user!: User;
}
