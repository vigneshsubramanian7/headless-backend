// const axios = require("axios");

function routes(fastify, options, done) {
    fastify.get("/", async (req, res) => {
        console.log("in");
        fastify.axios.magento
            .post("/guest-carts")
            .then(({ data: guestCartData, status: guestCartStatus }) => {
                console.log("1 guest-carts");
                if (guestCartStatus === 200) {
                    fastify.axios.magento
                        .post(`/guest-carts/${guestCartData}/items`, {
                            cartItem: {
                                sku: "SM231",
                                qty: 1,
                                quoteId: guestCartData,
                                productOption: {
                                    extensionAttributes: {
                                        customOptions: [
                                            {
                                                optionId: "20764",
                                                optionValue: "993439",
                                            },
                                        ],
                                    },
                                },
                            },
                        })
                        .then(
                            ({
                                data: addProductsData,
                                status: addProductsStatus,
                            }) => {
                                console.log("1 guest-carts / addProductsData");
                                if (addProductsStatus === 200) {
                                    fastify.axios.magento
                                        .post(
                                            `/guest-carts/${guestCartData}/estimate-shipping-methods`,
                                            {
                                                address: {
                                                    region: "New York",
                                                    region_id: 43,
                                                    region_code: "NY",
                                                    country_id: "US",
                                                    street: ["123 Oak Ave"],
                                                    postcode: "10577",
                                                    city: "Purchase",
                                                    firstname: "Jane",
                                                    lastname: "Doe",
                                                    customer_id: 4,
                                                    email: "jdoe@example.com",
                                                    telephone: "(512) 555-1111",
                                                    same_as_billing: 1,
                                                },
                                            }
                                        )
                                        .then(
                                            ({
                                                data: shippingMethodData,
                                                status: shippingMethodStatus,
                                            }) => {
                                                console.log(
                                                    "shippingMethodData"
                                                );
                                                if (
                                                    shippingMethodStatus === 200
                                                ) {
                                                    fastify.axios.magento
                                                        .post(
                                                            `guest-carts/${guestCartData}/shipping-information`,
                                                            {
                                                                addressInformation: {
                                                                    shipping_address: {
                                                                        region:
                                                                            "New York",
                                                                        region_id: 43,
                                                                        region_code:
                                                                            "NY",
                                                                        country_id:
                                                                            "US",
                                                                        street: [
                                                                            "123 Oak Ave",
                                                                        ],
                                                                        postcode:
                                                                            "10577",
                                                                        city:
                                                                            "Purchase",
                                                                        firstname:
                                                                            "Jane",
                                                                        lastname:
                                                                            "Doe",
                                                                        email:
                                                                            "jdoe@example.com",
                                                                        telephone:
                                                                            "512-555-1111",
                                                                    },
                                                                    billing_address: {
                                                                        region:
                                                                            "New York",
                                                                        region_id: 43,
                                                                        region_code:
                                                                            "NY",
                                                                        country_id:
                                                                            "US",
                                                                        street: [
                                                                            "123 Oak Ave",
                                                                        ],
                                                                        postcode:
                                                                            "10577",
                                                                        city:
                                                                            "Purchase",
                                                                        firstname:
                                                                            "Jane",
                                                                        lastname:
                                                                            "Doe",
                                                                        email:
                                                                            "jdoe@example.com",
                                                                        telephone:
                                                                            "512-555-1111",
                                                                    },
                                                                    shipping_carrier_code:
                                                                        "flatrate",
                                                                    shipping_method_code:
                                                                        "flatrate",
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
                                                                    fastify.axios.magentoWithoutHeaders
                                                                        .post(
                                                                            `guest-carts/${guestCartData}/payment-information`,
                                                                            {
                                                                                email:
                                                                                    "jdoe@example.com",
                                                                                paymentMethod: {
                                                                                    method:
                                                                                        "authnetcim",
                                                                                    extension_attributes: {
                                                                                        agreement_ids: [
                                                                                            "2",
                                                                                        ],
                                                                                    },
                                                                                    additional_data: {
                                                                                        cc_cid:
                                                                                            "123",
                                                                                        cc_type:
                                                                                            "VI",
                                                                                        cc_exp_year:
                                                                                            "2021",
                                                                                        cc_exp_month:
                                                                                            "3",
                                                                                        cc_number:
                                                                                            "4111111111111111",
                                                                                    },
                                                                                },
                                                                                billing_address: {
                                                                                    email:
                                                                                        "jdoe@example.com",
                                                                                    region:
                                                                                        "New York",
                                                                                    region_id: 43,
                                                                                    region_code:
                                                                                        "NY",
                                                                                    country_id:
                                                                                        "US",
                                                                                    street: [
                                                                                        "123 Oak Ave",
                                                                                    ],
                                                                                    postcode:
                                                                                        "10577",
                                                                                    city:
                                                                                        "Purchase",
                                                                                    telephone:
                                                                                        "512-555-1111",
                                                                                    firstname:
                                                                                        "Jane",
                                                                                    lastname:
                                                                                        "Doe",
                                                                                },
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
                                                                                    return res.send(
                                                                                        paymentInfoData
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
                                                                        .catch(
                                                                            (
                                                                                err
                                                                            ) => {
                                                                                console.log(
                                                                                    err.response
                                                                                );
                                                                                return res.send(
                                                                                    {
                                                                                        err:
                                                                                            "Error Payment Information",
                                                                                    }
                                                                                );
                                                                            }
                                                                        );
                                                                } else {
                                                                    return res.send(
                                                                        {
                                                                            err:
                                                                                "Error shipping Information",
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
                                                                    "Error shipping Information",
                                                            });
                                                        });
                                                } else {
                                                    return res.send({
                                                        err:
                                                            "Error Shipping Methods",
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
                                } else {
                                    return res.send({
                                        err: "Error Adding Products To Cart",
                                    });
                                }
                            }
                        )
                        .catch((err) => {
                            console.log(err.response);
                            return res.send({
                                err: "Error Adding Products To Cart",
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
    });

    done();
}

module.exports = routes;
