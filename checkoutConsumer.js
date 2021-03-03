const amqp = require("amqplib/callback_api");
const axios = require("axios");
require("dotenv").config();
const { Client } = require("pg");
const connectionString = process.env.PostgresURI;

const client = new Client({
    connectionString,
});

amqp.connect(
    `amqp://${process.env.RabbitMQuser}:${process.env.RabbitMQpass}@localhost`,
    (connError, conn) => {
        if (connError) {
            throw connError;
        }
        // STEP 2: Create / Connect to Channel
        conn.createChannel((channelErr, channel) => {
            if (channelErr) throw channelErr;
            // STEP 3: Create / Assert a Queue
            const QUEUE = "GuestCheckout";
            channel.assertQueue(QUEUE);
            // STEP4:
            channel.consume(
                QUEUE,
                (e) => {
                    const id = JSON.parse(e.content);
                    GuestCheckout(id);
                    // console.log(id);
                },
                {
                    noAck: true,
                }
            );
        });
    }
);

function PrepareItems({ sku, qty, option_type_id }, guestCartData) {
    let customOptions = Object.keys(option_type_id).map((key) => {
        return {
            optionId: key,
            optionValue: option_type_id[key],
        };
    });
    return {
        sku,
        qty,
        quoteId: guestCartData,
        productOption: {
            extensionAttributes: {
                customOptions,
            },
        },
    };
}

function GuestCheckout(data) {
    console.log({ TimeStart: new Date().getTime() });
    const baseURL = "https://staging.elementvape.com/rest/default/V1";
    const {
        items,
        shipping_address,
        billing_address,
        shippingmethod,
        creditCardInfo,
        email,
        id,
        magentouserid,
        loginUserToken,
    } = data;

    console.log("flow Started");
    let isGuest = magentouserid ? "carts/mine" : "guest-carts";
    const token = loginUserToken
        ? loginUserToken
        : process.env.MagentoAdminToken;
    const header = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    console.log({
        header,
        URL: baseURL + "/" + isGuest,
        BODY: JSON.stringify(PrepareItems(items[0], "guestCartData")),
    });
    axios
        .post(baseURL + "/" + isGuest, "", header)
        .then(async ({ data: guestCartData, status: guestCartStatus }) => {
            console.log({ guestCartData });
            if (guestCartStatus === 200) {
                const addItems = items.map((item, i) => {
                    const formatedItem = PrepareItems(item, guestCartData);
                    if (!magentouserid) {
                        isGuest = "guest-carts/" + guestCartData;
                    }
                    return axios
                        .post(
                            `${baseURL}/${isGuest}/items`,
                            {
                                cartItem: formatedItem,
                            },
                            header
                        )
                        .then(
                            ({
                                data: addProductsData,
                                status: addProductsStatus,
                            }) => {
                                return addProductsData;
                            }
                        )
                        .catch((err) => {
                            console.log(err.response);
                            return res.send({
                                err: "Error Adding Products To Cart",
                            });
                        });
                });
                Promise.all(addItems).then(function (results) {
                    console.log("1 guest-carts / addProductsData");
                    axios
                        .post(
                            `${baseURL}/${isGuest}/estimate-shipping-methods`,
                            {
                                address: shipping_address,
                            },
                            header
                        )
                        .then(
                            async ({
                                data: shippingmethodData,
                                status: shippingmethodStatus,
                            }) => {
                                console.log("shippingmethodData");
                                if (shippingmethodStatus === 200) {
                                    axios
                                        .post(
                                            `${baseURL}/${isGuest}/shipping-information`,
                                            {
                                                addressInformation: {
                                                    shipping_address,
                                                    billing_address,
                                                    shipping_carrier_code: shippingmethod,
                                                    shipping_method_code: shippingmethod,
                                                },
                                            },
                                            header
                                        )
                                        .then(
                                            async ({
                                                data: shippingInformationData,
                                                status: shippingInformationStatus,
                                            }) => {
                                                console.log(
                                                    "shippingInformationData"
                                                );
                                                if (
                                                    shippingInformationStatus ===
                                                    200
                                                ) {
                                                    axios
                                                        .post(
                                                            `${baseURL}/${isGuest}/payment-information`,
                                                            {
                                                                email: email,
                                                                paymentMethod: creditCardInfo,
                                                                billing_address: billing_address
                                                                    ? billing_address
                                                                    : shipping_address,
                                                            },
                                                            header
                                                        )
                                                        .then(
                                                            async ({
                                                                data: paymentInfoData,
                                                                status: paymentInfoStatus,
                                                            }) => {
                                                                console.log(
                                                                    "paymentInfoData"
                                                                );
                                                                if (
                                                                    paymentInfoStatus ===
                                                                    200
                                                                ) {
                                                                    console.log(
                                                                        "Payment Success 1",
                                                                        id
                                                                    );
                                                                    client
                                                                        .connect()
                                                                        .then(
                                                                            async () => {
                                                                                console.log(
                                                                                    "Payment Success 2"
                                                                                );
                                                                                await client.query(
                                                                                    "UPDATE orders SET statusinfo = $1 WHERE id = $2",
                                                                                    [
                                                                                        {
                                                                                            status: true,
                                                                                            message:
                                                                                                "Order Placed Successfully",
                                                                                        },
                                                                                        id,
                                                                                    ]
                                                                                );
                                                                                console.log(
                                                                                    {
                                                                                        TimeEnd: new Date().getTime(),
                                                                                    }
                                                                                );
                                                                                console.log(
                                                                                    "Payment Success 3"
                                                                                );
                                                                            }
                                                                        )
                                                                        .finally(
                                                                            () =>
                                                                                client.end()
                                                                        );
                                                                } else {
                                                                    await client.query(
                                                                        "UPDATE orders SET statusinfo = $1 WHERE id = $2",
                                                                        [
                                                                            {
                                                                                status: false,
                                                                                message:
                                                                                    "Error Payment Information",
                                                                            },
                                                                            id,
                                                                        ]
                                                                    );
                                                                    return res.send(
                                                                        {
                                                                            err:
                                                                                "Error Payment Information",
                                                                        }
                                                                    );
                                                                }
                                                            }
                                                        )
                                                        .catch((err) => {
                                                            console.log(
                                                                err.response
                                                            );
                                                            client
                                                                .connect()
                                                                .then(
                                                                    async () => {
                                                                        await client.query(
                                                                            "UPDATE orders SET statusinfo = $1 WHERE id = $2",
                                                                            [
                                                                                {
                                                                                    status: false,
                                                                                    message:
                                                                                        err.response,
                                                                                },
                                                                                id,
                                                                            ]
                                                                        );
                                                                    }
                                                                )
                                                                .finally(() =>
                                                                    client.end()
                                                                );
                                                            return res.send({
                                                                err:
                                                                    "Error Payment Information",
                                                            });
                                                        });
                                                } else {
                                                    await client.query(
                                                        "UPDATE orders SET statusinfo = $1 WHERE id = $2",
                                                        [
                                                            {
                                                                status: false,
                                                                message:
                                                                    "Error shipping Information",
                                                            },
                                                            id,
                                                        ]
                                                    );
                                                    return res.send({
                                                        err:
                                                            "Error shipping Information",
                                                    });
                                                }
                                            }
                                        )
                                        .catch((err) => {
                                            console.log(err.response);
                                            client
                                                .connect()
                                                .then(async () => {
                                                    await client.query(
                                                        "UPDATE orders SET statusinfo = $1 WHERE id = $2",
                                                        [
                                                            {
                                                                status: false,
                                                                message:
                                                                    err.response,
                                                            },
                                                            id,
                                                        ]
                                                    );
                                                })
                                                .finally(() => client.end());
                                            return res.send({
                                                err:
                                                    "Error shipping Information",
                                            });
                                        });
                                } else {
                                    await client.query(
                                        "UPDATE orders SET statusinfo = $1 WHERE id = $2",
                                        [
                                            {
                                                status: false,
                                                message:
                                                    "Error Shipping Methods",
                                            },
                                            id,
                                        ]
                                    );
                                    return res.send({
                                        err: "Error Shipping Methods",
                                    });
                                }
                            }
                        )
                        .catch((err) => {
                            console.log(err.response);
                            client
                                .connect()
                                .then(async () => {
                                    await client.query(
                                        "UPDATE orders SET statusinfo = $1 WHERE id = $2",
                                        [
                                            {
                                                status: false,
                                                message: err.response,
                                            },
                                            id,
                                        ]
                                    );
                                })
                                .finally(() => client.end());
                            return res.send({
                                err: "Error Shipping Methods",
                            });
                        });
                });
            } else {
                await client.query(
                    "UPDATE orders SET statusinfo = $1 WHERE id = $2",
                    [
                        {
                            status: false,
                            message: "Error Creating Cart",
                        },
                        id,
                    ]
                );
                return res.send({ err: "Error Creating Cart" });
            }
        })
        .catch((err) => {
            console.log(err.response);
            client
                .connect()
                .then(async () => {
                    await client.query(
                        "UPDATE orders SET statusinfo = $1 WHERE id = $2",
                        [
                            {
                                status: false,
                                message: err.response,
                            },
                            id,
                        ]
                    );
                })
                .finally(() => client.end());
            return res.send({ err: "Error Creating Cart" });
        });
}
