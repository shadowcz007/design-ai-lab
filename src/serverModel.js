const http = require("http"),fs=require('fs'),path=require('path');
const internalIp = require('internal-ip');
const _port=3399;
let url = `http://${internalIp.v4.sync()}:${_port}`;
// 更新ip地址
function updateHost() {
    url = `http://${internalIp.v4.sync()}:${_port}`;
}

const server = http.createServer(function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');


    if (req.url === '/mobilenet_v2/model.json') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(fs.readFileSync(path.join(__dirname, '../model/mobilenet_v2/model.json')));
    }else if(req.url === '/mobilenet_v2/weights.bin') {
        res.writeHead(200, {'Content-Type': 'application/x-binary'});
        res.end(fs.readFileSync(path.join(__dirname, '../model/mobilenet_v2/weights.bin')));
    };

});

server.listen(_port);

module.exports = {
    url,updateHost
}