'use strict';

const TABLE = 'users';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(TABLE, 'financialCushion', {
            type: Sequelize.FLOAT,
            allowNull: true,
            defaultValue: 0,
        });

        await queryInterface.addColumn(TABLE, 'categoryLimits', {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: {},
        });

        await queryInterface.addColumn(TABLE, 'notificationSettings', {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: {
                categoryLimitWarning: true,
                financialCushionWarning: true,
                anomalousTransactionAlert: true,
                monthlyReport: true,
            },
        });

        await queryInterface.changeColumn(TABLE, 'transactionLimit', {
            type: Sequelize.FLOAT,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn(TABLE, 'financialCushion');
        await queryInterface.removeColumn(TABLE, 'categoryLimits');
        await queryInterface.removeColumn(TABLE, 'notificationSettings');
    },
};

