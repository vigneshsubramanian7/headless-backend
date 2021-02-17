const amqp = require("amqplib/callback_api");

// let request = {
//     items: [
//         {
//             option_type_id: {
//                 3647: 79463,
//                 46638: 2366485,
//                 59205: 2447643,
//                 59206: 2447647,
//             },
//             option_type_data: {
//                 Version: { title: "V8 Baby MESH Core", price: 5 },
//                 "Juice of the Weeks": {
//                     title: "Very Cool - Naked 100 E-Liquid 60mL (6mg)",
//                     price: 13,
//                 },
//                 Strength: { title: "3mg", price: 0 },
//             },
//             name: "SMOK TFV8 Baby Replacement Coils",
//             price: 32.95,
//             qty: 1,
//             sku: "SM089",
//             media_gallery_entries:
//                 "/s/m/smok_tfv8_baby_turbo_engines_replacement_coils_and_rba_2.jpg",
//         },
//     ],
//     shipping_address: {
//         region: "Alabama",
//         region_id: "1",
//         region_code: "AL",
//         country_id: "US",
//         street: "address",
//         postcode: "600046",
//         city: "chennai",
//         firstname: "vignesh",
//         lastname: "test",
//         customer_id: 4,
//         email: "vigneshsubramanian15@gmail.com",
//         telephone: "08072048159",
//         same_as_billing: 1,
//     },
//     billing_address: null,
//     shippingmethod: "fedexflatrate",
//     creditCardInfo: {
//         additional_data: {
//             cc_cid: "123",
//             cc_type: "MasterCard",
//             cc_exp_year: "03",
//             cc_exp_month: "2023",
//             cc_number: "5424000000000015",
//         },
//         extension_attributes: { agreement_ids: Array(1) },
//         method: "authnetcim",
//     },
//     email: "vigneshsubramanian15@gmail.com",
// };

function routes(fastify, options, done) {
    fastify.post("/", async (req, res) => {
        const client = await fastify.pg.connect();
        // console.log(req.body);
        const {
            items,
            shipping_address,
            billing_address,
            shippingmethod,
            creditCardInfo,
            email,
        } = req.body;
        const {
            rows,
        } = await client.query(
            "INSERT INTO orders (items, shippingaddress, billingaddress, shippingmethod, creditcardinfo, email, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            [
                items,
                shipping_address,
                billing_address,
                shippingmethod,
                creditCardInfo,
                email,
                0,
            ]
        );
        client.release();
        amqp.connect("amqp://user:bitnami@localhost", (connError, conn) => {
            if (connError) {
                throw connError;
            }
            // STEP 2: Create / Connect to Channel
            conn.createChannel((channelErr, channel) => {
                if (channelErr) throw channelErr;
                // STEP 3: Create / Assert a Queue
                const QUEUE = "GuestCheckout";
                channel.assertQueue(QUEUE);
                // STEP 4: Send Message to QUEUE
                channel.sendToQueue(
                    QUEUE,
                    Buffer.from(
                        JSON.stringify({
                            items,
                            shipping_address,
                            billing_address,
                            shippingmethod,
                            creditCardInfo,
                            email,
                        })
                    )
                );
            });
        });
        return rows[0].id;
    });

    done();
}

module.exports = routes;
