

function checkURLIsOk(url) {

    let timeoutPromise = (timeout) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(false);
            }, timeout);
        });
    }
    let requestPromise = (url) => {
        return fetch(url);
    };

    return new Promise((resolve, reject) => {
        Promise.race([timeoutPromise(1000), requestPromise(url)])
            .then(res => {
                if (res) res = res.ok;
                resolve(res);
            })
            .catch(err => {
                resolve(false);
            });
    });
}



module.exports = {
    checkURLIsOk
};