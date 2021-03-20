
const internalIp = require('internal-ip');
const socket = require('socket.io-client')(`wss://${internalIp.v4.sync()}`, { 
    secure:true,
    reconnect: true,
    rejectUnauthorized : false
});
// socket.on("connect", () => {
//     console.log(socket.id); // x8WIv7-mJelg7on_ALbx
// });
// socket.on("disconnect", () => {
//     console.log(socket.id); // undefined
// });

class CameraWeb {
    constructor() {
        // socket = io(`wss://${internalIp.v4.sync()}`);
        this.canvas = document.createElement('canvas');
        socket.on('chat message', msg => {
            if (msg.type === 'video') {
                this.drawResult(msg.data)
            } else if(msg.type==='text'){
                console.log(msg.data)
            }
        });
        socket.emit('chat message', {
            type: 'text',
            data: 'hhh'
        });
        this.ctx = this.canvas.getContext('2d');
        // console.log(socket)

    }
    drawResult(base64) {
        let im = new Image();
        im.src = base64;
        im.onload = () => {
            if (!this.width) {
                this.canvas.width = im.naturalWidth;
                this.canvas.height = im.naturalHeight;
                this.width = im.naturalWidth;
                this.height = im.naturalHeight;
                console.log(this.width,this.height)
            };
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.ctx.drawImage(im, 0, 0, this.width, this.height);
        }
    }
};


module.exports = {
    CameraWeb
};