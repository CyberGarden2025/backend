import { Model } from 'sequelize-typescript';

export declare type Constructor<T> = new (...args: any[]) => T;
export declare type ModelType<T extends Model<T>> = Constructor<T> & typeof Model;
