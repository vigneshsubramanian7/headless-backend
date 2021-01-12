function routes(fastify, options, done) {
    fastify.get("/", async (req, res) => {
        return "Welcome To DCKAP";
    });

    fastify.get("/id/:id", async (req, res) => {
        const client = await fastify.pg.connect();
        const { id } = req.params;
        const { rows } = await client.query(
            "SELECT * FROM products WHERE prod_id=" + id
        );
        client.release();
        return rows;
    });

    fastify.get("/:url_key", async (req, res) => {
        const client = await fastify.pg.connect();
        const { url_key } = req.params;
        const {
            rows,
        } = await client.query(`SELECT * FROM products WHERE url_key=$1`, [
            url_key,
        ]);
        client.release();
        return rows;
    });

    fastify.get("/selected/:url_key", async (req, res) => {
        const client = await fastify.pg.connect();
        const { url_key } = req.params;
        console.log(url_key);
        const {
            rows,
        } = await client.query(
            "SELECT media_gallery_entries,custom_attributes, product_links, options FROM products WHERE url_key=$1",
            [url_key]
        );
        client.release();
        return rows;
    });

    fastify.get("/selected/id/:id", async (req, res) => {
        const client = await fastify.pg.connect();
        const { id } = req.params;
        const { rows } = await client.query(
            "SELECT media_gallery_entries,custom_attributes, product_links, options FROM products WHERE prod_id=" +
                id
        );
        client.release();
        return rows;
    });

    fastify.get("/category/:id", async (req, res) => {
        const client = await fastify.pg.connect();
        const { id } = req.params;
        const { rows } = await client.query(
            "SELECT id, prod_id, sku, name, price, url_key, image FROM products WHERE category @> ARRAY['" +
                id +
                "']::text[] order by prod_id DESC limit 12 offset 1 "
        );
        client.release();
        return rows;
    });

    done();
}

module.exports = routes;
