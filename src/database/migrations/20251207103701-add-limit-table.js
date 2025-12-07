// migrations/YYYYMMDDHHMMSS-create-limits-table.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('limits', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            icon: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            limit: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            spent: {
              type: Sequelize.FLOAT,
              allowNull: true,
              defaultValue: 0
            },
            period: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            categories: {
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: [],
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        await queryInterface.addIndex('limits', ['userId']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('limits');
    }
};