const fastifyPlugin = require("fastify-plugin");

function utility(fastify, options, done) {
    fastify.decorate("addnum", (a, b) => {
        return a + b;
    });

    fastify.decorate("subnum", (a, b) => {
        return a - b;
    });

    done();
}
module.exports = fastifyPlugin(utility);
