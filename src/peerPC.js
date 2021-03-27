const Peer = require('peerjs').default;
const { ipcRenderer, remote } = require("electron");
const internalIp = require('internal-ip');

class PeerPC {
    constructor(displayVideo, open) {
        //手机传来的视频
        this.displayVideo = displayVideo || ((v) => {});
        this.open = open || ((v) => {});

        const peer = new Peer(null, {
            host: 'mixlab.top',
            secure: true,
            path: "/myapp"
        });

        peer.on('open', id => {
            console.log('peer open', id);
            this.id = id;
            this.open(this.getMobileUrl());
        });
        // disconnected from PeerJS server
        peer.on('close', id => {
            console.log('peer close', id);
        });
        peer.on('connection', (conn) => {
            console.log('connection', conn);
            conn.on('data', (data) => {
                conn.send('ready');
            });
        });

        peer.on('call', incoming_call => {
            console.log("Got a call!", incoming_call);
            incoming_call.answer();
            incoming_call.on('stream', remoteStream => {
                this.displayVideo(incoming_call.peer, remoteStream);
            });
        });
        this.peer = peer;

    }

    getMobileUrl() {
        let host = internalIp.v4.sync();
        return `https://${host}?id=${this.id}`;
    }
}


module.exports = PeerPC;