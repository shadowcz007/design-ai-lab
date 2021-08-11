// 远程的peerjs服务
const defaultHost = {
    host: 'mixlab.top',
    path: "/myapp"
}

// let peerServer;

// function localServer() {
//     const { PeerServer } = require('peer');
//     // const peerServer = ExpressPeerServer(server, {
//     //     debug: true,
//     //     path: '/myapp',
//     //     // port: 9000
//     // });
//     // console.log(server)

//     // const makeCert=require('make-cert');
//     // const {key, cert} = makeCert('localhost');
//     // console.log(key)
//     // console.log(cert)

//     const customGenerationFunction = () => {
//         // console.log(data)
//         return (Math.random().toString(36) + '0000000000000000000').substr(2, 16)
//     };
//     peerServer = PeerServer({
//         port: 9000,
//         debug: true,
//         // proxied: true,
//         path: '/myapp',
//         ssl: {
//             key: server.key,
//             cert: server.cert
//         },
//         generateClientId: customGenerationFunction
//     });
//     peerServer.on('connection', c => {
//         console.log('connection', c.id)
//     });
//     peerServer.on('disconnect', c => {
//         console.log('disconnect', c.id)
//     });
// }
