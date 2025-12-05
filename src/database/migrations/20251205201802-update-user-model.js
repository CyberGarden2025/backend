'use strict';

const TABLE = 'users';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(TABLE, 'transactionLimit', {
            allowNull: true,
            type: Sequelize.FLOAT,
        });

        await queryInterface.addColumn(TABLE, 'balance', {
            allowNull: false,
            defaultValue: 0,
            type: Sequelize.FLOAT,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn(TABLE, 'balance');
        await queryInterface.removeColumn(TABLE, 'transactionLimit');
    },
};
