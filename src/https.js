const https = require('@small-tech/https')
const fs = require('fs');
const path = require('path');

// const { ExpressPeerServer } = require('peer');

// console.log(path.join(__dirname, './mobile.html'))


// const { remote } = require("electron");

const internalIp = require('internal-ip');
let host = internalIp.v4.sync(),
    url = `https://${host}`;

// 远程的peerjs服务
const defaultHost = {
    host: 'mixlab.top',
    path: "/myapp"
}

let peerServer;

// 更新ip地址
function updateHost() {
    host = internalIp.v4.sync(), url = `https://${host}`;
}

const server = https.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');

    console.log(req.url);
    // console.log(req.url.replace(/\?.*/ig, ''));
    let reqUrlBase = req.url.replace(/\?.*/ig, '');
    if (reqUrlBase === '/') {
        const html = fs.readFileSync(path.join(__dirname, './mobile.html'), 'utf8');
        res.writeHead(200, { 'Content-type': 'text/html' });
        // res.write(`<h1>~</h1>`);
        res.end(html);

    } else if (reqUrlBase === '/socket.io.js') {
        const js = fs.readFileSync(path.join(__dirname, '../node_modules/socket.io/client-dist/socket.io.min.js'), 'utf8');
        res.writeHead(200, { 'Content-type': 'application/javascript' });
        res.end(js);

    } else if (reqUrlBase === '/peer.js') {
        const js = fs.readFileSync(path.join(__dirname, '../node_modules/peerjs/dist/peerjs.min.js'), 'utf8');
        res.writeHead(200, { 'Content-type': 'application/javascript' });
        res.end(js);

    } else if (reqUrlBase === '/mobilenet_v2/model.json') {
        // 模型
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(fs.readFileSync(path.join(__dirname, '../model/mobilenet_v2/model.json')));
    } else if (reqUrlBase === '/mobilenet_v2/weights.bin') {
        // 模型
        res.writeHead(200, { 'Content-Type': 'application/x-binary' });
        res.end(fs.readFileSync(path.join(__dirname, '../model/mobilenet_v2/weights.bin')));
    };

});


server.listen(443, () => {
    console.log(` 🎉 Server running at ${url}`)
});

const io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
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

function localServer() {
    const { PeerServer } = require('peer');
    // const peerServer = ExpressPeerServer(server, {
    //     debug: true,
    //     path: '/myapp',
    //     // port: 9000
    // });
    // console.log(server)

    // const makeCert=require('make-cert');
    // const {key, cert} = makeCert('localhost');
    // console.log(key)
    // console.log(cert)

    const customGenerationFunction = () => {
        // console.log(data)
        return (Math.random().toString(36) + '0000000000000000000').substr(2, 16)
    };
    peerServer = PeerServer({
        port: 9000,
        debug: true,
        // proxied: true,
        path: '/myapp',
        ssl: {
            key: server.key,
            cert: server.cert
        },
        generateClientId: customGenerationFunction
    });
    peerServer.on('connection', c => {
        console.log('connection', c.id)
    });
    peerServer.on('disconnect', c => {
        console.log('disconnect', c.id)
    });
}


module.exports = {
    url,
    host,
    updateHost,
    localServer,
    defaultHost
}