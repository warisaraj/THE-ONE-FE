const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require("fs");
const {createProxyMiddleware} = require('http-proxy-middleware');

const app = express();

const fePort = process.env.FE_PORT ? +process.env.FE_PORT : 443;
const beTarget = process.env.BE_TARGET || 'http://127.0.0.1:8897';
const ssl = process.env.SSL || false;

app.use(express.static(__dirname + '/dist'));

app.use('/socket.io', createProxyMiddleware({target: beTarget, ws: true, secure: false}));
app.use('/api', createProxyMiddleware({target: beTarget, changeOrigin: true, secure: false, logger: console}));
app.use('/download', createProxyMiddleware({target: beTarget, changeOrigin: true, secure: false, logger: console}));
app.get('/*', (req, res) => res.sendFile(path.join(__dirname)));

console.log('ssl', ssl);
if (ssl === true || ssl === 'true') {
    const sslKey = process.env.SSL_KEY || '/tmp/Test-WildCard-2021_bumrungrad_org.key';
    const sslCrt = process.env.SSL_CRT || '/tmp/Test-WildCard-2021.bumrungrad.org.crt';
    const key = fs.readFileSync(sslKey);
    const cert = fs.readFileSync(sslCrt);
    const options = {
        key: key,
        cert: cert
    };

    https.createServer(options, app).listen(fePort, function (err) {
        if (err) (
            console.log(err)
        );
        console.log(`> Ready on port: ${fePort}`);
    });
} else {
    http.createServer(app).listen(fePort, '0.0.0.0', function (err) {
        console.log(`> Ready on port: ${fePort}`);
    });
}



