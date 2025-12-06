'use strict';

const TABLE = 'transactions';
const COLUMN = 'userId';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async transaction => {
            // Drop FK constraint if it exists (old FK to users.id)
            await queryInterface.sequelize.query(
                'ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_userId_fkey";',
                { transaction },
            );

            // Change userId to string to store Keycloak UUID
            await queryInterface.changeColumn(
                TABLE,
                COLUMN,
                {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                { transaction },
            );
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async transaction => {
            await queryInterface.changeColumn(
                TABLE,
                COLUMN,
                {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                { transaction },
            );

            // Restore FK to users.id
            await queryInterface.addConstraint(TABLE, {
                fields: [COLUMN],
                type: 'foreign key',
                name: 'transactions_userId_fkey',
                references: {
                    table: 'users',
                    field: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                transaction,
            });
        });
    },
};
