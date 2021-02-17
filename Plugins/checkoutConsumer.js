const amqp = require("amqplib/callback_api");
const axios = require("axios");

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
    const baseURL = "https://staging.elementvape.com/rest/default/V1";
    const {
        items,
        shipping_address,
        billing_address,
        shippingmethod,
        creditCardInfo,
        email,
    } = data;

    console.log("flow Started");
    axios
        .post(baseURL + "/guest-carts", {
            headers: {
                Authorization: `Bearer ${process.env.MagentoAdminToken}`,
            },
        })
        .then(({ data: guestCartData, status: guestCartStatus }) => {
            console.log("1 guest-carts");
            if (guestCartStatus === 200) {
                const addItems = items.map((item, i) => {
                    const formatedItem = PrepareItems(item, guestCartData);
                    console.log(formatedItem, i);
                    return axios
                        .post(
                            `${baseURL}/guest-carts/${guestCartData}/items`,
                            {
                                cartItem: formatedItem,
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${process.env.MagentoAdminToken}`,
                                },
                            }
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
                            `${baseURL}/guest-carts/${guestCartData}/estimate-shipping-methods`,
                            {
                                address: shipping_address,
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${process.env.MagentoAdminToken}`,
                                },
                            }
                        )
                        .then(
                            ({
                                data: shippingmethodData,
                                status: shippingmethodStatus,
                            }) => {
                                console.log("shippingmethodData");
                                if (shippingmethodStatus === 200) {
                                    axios
                                        .post(
                                            `${baseURL}/guest-carts/${guestCartData}/shipping-information`,
                                            {
                                                addressInformation: {
                                                    shipping_address,
                                                    billing_address,
                                                    shipping_carrier_code: shippingmethod,
                                                    shipping_method_code: shippingmethod,
                                                },
                                            },
                                            {
                                                headers: {
                                                    Authorization: `Bearer ${process.env.MagentoAdminToken}`,
                                                },
                                            }
                                        )
                                        .then(
                                            ({
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
                                                            `${baseURL}/guest-carts/${guestCartData}/payment-information`,
                                                            {
                                                                email: email,
                                                                paymentMethod: creditCardInfo,
                                                                billing_address: billing_address
                                                                    ? billing_address
                                                                    : shipping_address,
                                                            }
                                                        )
                                                        .then(
                                                            ({
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
                                                                        "Payment Success"
                                                                    );
                                                                } else {
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
                                                            return res.send({
                                                                err:
                                                                    "Error Payment Information",
                                                            });
                                                        });
                                                } else {
                                                    return res.send({
                                                        err:
                                                            "Error shipping Information",
                                                    });
                                                }
                                            }
                                        )
                                        .catch((err) => {
                                            console.log(err.response);
                                            return res.send({
                                                err:
                                                    "Error shipping Information",
                                            });
                                        });
                                } else {
                                    return res.send({
                                        err: "Error Shipping Methods",
                                    });
                                }
                            }
                        )
                        .catch((err) => {
                            console.log(err.response);
                            return res.send({
                                err: "Error Shipping Methods",
                            });
                        });
                });
            } else {
                return res.send({ err: "Error Creating Cart" });
            }
        })
        .catch((err) => {
            console.log(err.response);
            return res.send({ err: "Error Creating Cart" });
        });
}
