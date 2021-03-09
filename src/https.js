const https = require('@small-tech/https')
const fs = require('fs');
const path = require('path');

console.log(path.join(__dirname, './mobile.html'))

const internalIp = require('internal-ip');


const server = https.createServer((req, res) => {
    const html = fs.readFileSync(path.join(__dirname, './mobile.html'), 'utf8');

    res.writeHead(200, { 'Content-type': 'text/html' });
    // res.write('<h1>Node.js</h1>');
    res.end(html);
});

const url = `https://${internalIp.v4.sync()}`;

server.listen(443, () => {
    console.log(` 🎉 Server running at ${url}`)
});

module.exports = {
    url
}