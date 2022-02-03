// 创建证书
const mkcert = require('mkcert');
const serverUrl = require('../server/serverUrl');

class Cert {
    create() {
       return new Promise((resolve, reject) => {
            // create a certificate authority
            mkcert.createCA(
                {
                    organization:'mixlab'+(new Date()).getTime(),
                    countryCode: 'CN',
                    state: 'shanghai'+(new Date()).getTime(),
                    locality: 'shanghai'+(new Date()).getTime(),
                    validityDays: 365
                }
            ).then(async ca => {
                let { host } = serverUrl.get();
                // then create a tls certificate
                // '127.0.0.1', 'localhost', 
                const cert = await mkcert.createCert({
                    domains: [host,'127.0.0.1', 'localhost'],
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

module.exports = new Cert();