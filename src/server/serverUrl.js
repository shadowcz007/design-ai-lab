const internalIp = require('internal-ip');

class ServerUrl {
    
    static getInstance() {
        if (!ServerUrl.instance) {
            ServerUrl.instance = new ServerUrl();
        }
        return ServerUrl.instance;
    }

    constructor() {
        this._HOST = internalIp.v4.sync();
        this._URL = `https://${this._HOST}`;
    }
    // 取服务地址
    get() {
        this.update();
        return {
            host: this._HOST,
            url: this._URL
        }
    }
    // 更新ip地址
    update() {
        this._HOST = internalIp.v4.sync();
        this._URL = `https://${this._HOST}`;
    };
}

module.exports = ServerUrl.getInstance();