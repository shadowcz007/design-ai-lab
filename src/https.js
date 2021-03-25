const https = require('@small-tech/https')
const fs = require('fs');
const path = require('path');
// const { ExpressPeerServer } = require('peer');
// const humanseg = require('@paddlejs-models/humanseg');
// humanseg.load();
// window.humanseg = humanseg;
// console.log(path.join(__dirname, './mobile.html'))

// const { remote } = require("electron");

const internalIp = require('internal-ip');
let host = internalIp.v4.sync(), url = `https://${host}`;
// 更新ip地址
function updateHost() {
    host = internalIp.v4.sync(), url = `https://${host}`;
}

const server = https.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.url === '/') {
        const html = fs.readFileSync(path.join(__dirname, './mobile.html'), 'utf8');
        res.writeHead(200, { 'Content-type': 'text/html' });
        // res.write('<h1>Node.js</h1>');
        res.end(html);
    } else if (req.url === '/host') {

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end({
            host: global._MHOST
        });

    } else if (req.url === '/socket.io.js') {
        const js = fs.readFileSync(path.join(__dirname, '../node_modules/socket.io/client-dist/socket.io.min.js'), 'utf8');
        res.writeHead(200, { 'Content-type': 'application/javascript' });
        res.end(js);
    } else if (req.url === '/peer.js') {
        const js = fs.readFileSync(path.join(__dirname, '../node_modules/peerjs/dist/peerjs.min.js'), 'utf8');
        res.writeHead(200, { 'Content-type': 'application/javascript' });
        res.end(js);
    } else if (req.url === '/mobilenet_v2/model.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(fs.readFileSync(path.join(__dirname, '../model/mobilenet_v2/model.json')));
    } else if (req.url === '/mobilenet_v2/weights.bin') {
        res.writeHead(200, { 'Content-Type': 'application/x-binary' });
        res.end(fs.readFileSync(path.join(__dirname, '../model/mobilenet_v2/weights.bin')));
    }
});




server.listen(443, () => {
    console.log(` 🎉 Server running at ${url}`)
});

const io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);

    io.emit('chat message', {
        type: 'host',
        data: global._MHOST
    });

    socket.on('chat message', (msg) => {
        if (msg.type === 'image') {
            //   console.log(msg.size)
            // let im = new Image();
            // im.src = msg.data;

            // im.onload = () => {
            //     humanseg.getGrayValue(im).then(({ data }) => {
            //         const canvas1 = document.createElement('canvas');
            //         humanseg.drawHumanSeg(canvas1, data);
            //         let base64 = canvas1.toDataURL();
            //         io.emit('chat message', {
            //             type: 'video',
            //             data: base64
            //         });
            //         base64 = null;
            //         im = null;
            //     });

            // }

        } else {
            io.emit('chat message', msg);
        }

    });

});


const { PeerServer } = require('peer');
// const peerServer = ExpressPeerServer(server, {
//     debug: true,
//     path: '/myapp',
//     // port: 9000
// });
// console.log(server)
const peerServer = PeerServer({
    port: 9000,
    // debug: true,
    // proxied: true,
    path: '/myapp',
    ssl: {
        key: server.key,
        cert: server.cert
    }
});
peerServer.on('connection', c => {
    console.log('connection', c.id)
});
peerServer.on('disconnect', c => {
    console.log('disconnect', c.id)
});
module.exports = {
    url, host,updateHost
}