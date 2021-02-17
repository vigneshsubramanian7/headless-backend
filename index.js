// Require the framework and instantiate it
const fastify = require("fastify")({
    logger: false,
});
require("dotenv").config();

fastify.register(require("./Plugins/Utility"));

console.log(process.env.PostgresURI);
//Postgres
fastify.register(require("fastify-postgres"), {
    connectionString: process.env.PostgresURI,
});
//axios
fastify.register(require("fastify-axios"), {
    clients: {
        magento: {
            baseURL: "https://staging.elementvape.com/rest/default/V1",
            headers: {
                Authorization: "Bearer j648jzfscclc01mcfb74fbvjhofvr369",
            },
        },
        magentoWithoutHeaders: {
            baseURL: "https://staging.elementvape.com/rest/default/V1",
        },
    },
});

//CORS
fastify.register(require("fastify-cors"), {
    // put your options here
});

//Routes
fastify.register(require("./Plugins/routes"));
fastify.register(require("./Plugins/checkout"), { prefix: "/checkout" });
// fastify.register(require("./Plugins/routes"), { prefix: "/api" });

// Run the server!
const start = async () => {
    try {
        await fastify.listen(3000);
    } catch (error) {
        console.log(error);
        fastify.log.error(error);
    }
};
start();
