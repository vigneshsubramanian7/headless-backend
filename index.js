// Require the framework and instantiate it
const fastify = require("fastify")({
    logger: false,
});

fastify.register(require("./Plugins/Utility"));

//Postgres
fastify.register(require("fastify-postgres"), {
    connectionString: "postgres://vignesh:77723442@34.228.8.206:5432/element",
});
//CORS
fastify.register(require("fastify-cors"), {
    // put your options here
});

//Routes
fastify.register(require("./Plugins/routes"));
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
