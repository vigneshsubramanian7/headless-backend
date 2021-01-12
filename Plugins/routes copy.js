const opt = {
    schema: {
        querystring: {},
        body: {},
        response: {
            200: {
                type: "object",
                properties: {
                    hello: { type: "string" },
                },
            },
        },
    },
};

function routes(fastify, options, done) {
    fastify.get("/", (req, res) => {
        return { hello: "World" };
    });

    fastify.post("/post", opt, (req, res) => {
        console.log(fastify.subnum(10, 5));
        return { hello: "World" };
    });

    done();
}

module.exports = routes;
