import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
    up: async (queryInterface: QueryInterface) => {
        // Insertar settings de captcha para la compañía 1 (configuración global)
        const captchaSettings = [
            {
                key: "captchaEnabled",
                value: "false",
                companyId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                key: "captchaType",
                value: "turnstile",
                companyId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                key: "captchaSiteKey",
                value: "",
                companyId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                key: "captchaSecretKey",
                value: "",
                companyId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // Usar upsert para evitar duplicados
        for (const setting of captchaSettings) {
            const existing = await queryInterface.sequelize.query(
                `SELECT id FROM "Settings" WHERE key = '${setting.key}' AND "companyId" = ${setting.companyId}`,
                { type: "SELECT" as any }
            );

            if ((existing as any[]).length === 0) {
                await queryInterface.bulkInsert("Settings", [setting]);
            }
        }
    },

    down: async (queryInterface: QueryInterface) => {
        await queryInterface.bulkDelete("Settings", {
            key: ["captchaEnabled", "captchaType", "captchaSiteKey", "captchaSecretKey"]
        } as any);
    }
};
