const route = require("express").Router();

route.use("/v1/sync", require("./v1/sync"));

module.exports = route;
