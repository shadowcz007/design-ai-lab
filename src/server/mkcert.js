// 创建证书
const mkcert = require('mkcert');
const serverUrl = require('./serverUrl');

class Cert {
    static getInstance() {
        if (!Cert.instance) {
            Cert.instance = new Cert();
        }
        return Cert.instance;
    }

    create() {
       return new Promise((resolve, reject) => {
            // create a certificate authority
            mkcert.createCA({
                organization: 'mixlab.top',
                countryCode: 'CN',
                state: 'shanghai',
                locality: 'lab',
                validityDays: 365
            }).then(async ca => {
                let { host } = serverUrl.get();
                // then create a tls certificate
                const cert = await mkcert.createCert({
                    domains: ['127.0.0.1', 'localhost', host],
                    validityDays: 365,
                    caKey: ca.key,
                    caCert: ca.cert
                });
                this.result={
                    key: cert.key,
                    cert: cert.cert
                };
                resolve(this.result);
            });
        })
    }
}

module.exports = Cert.getInstance();