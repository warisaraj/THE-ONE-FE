const express = require('express');
const app = express();
const fs = require("fs");

const frontEndPort = process.env.FE_PORT || 6001;

app.use(express.static( __dirname + '/dist'));

console.log('frontEndPort : ' + frontEndPort);


app.listen(frontEndPort, function () {
    console.log('frontEndPort app listening on port ' + frontEndPort + '!');
});
