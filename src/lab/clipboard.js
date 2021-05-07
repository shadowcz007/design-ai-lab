/**
 * 剪切板
 */

const md5 = require('md5');
const { clipboard, remote, nativeImage } = require('electron');
const _APPICON = remote.getGlobal('_APPICON');

const Store = require('./store');

class Clipboard {

    /**写入剪切板
     * 
     * @param {*} data 
     * @param {String} type 
     */
    write(data, type = 'text') {
            type = type.toLowerCase();
            if (type === 'text') {
                clipboard.writeText(data);
            } else if (type === 'html') {
                clipboard.writeHTML(data);
            } else if (type === 'base64') {
                let img = nativeImage.createFromDataURL(data);
                clipboard.writeImage(img);
            }
        }
        //读取剪切板
        /**
         * 
         * @param {*} type 
         */
    read(type = 'text') {
        type = type.toLowerCase();
        let res;
        if (type === 'text') {
            res = clipboard.readText();
        } else if (type == 'html') {
            res = clipboard.readHTML();
        } else if (type == 'img') {
            res = clipboard.readImage();
            if (res.isEmpty()) {
                res = null;
            };
            // else{
            //     res=res.toDataURL();
            // }
        };
        return res
    }
    clear() {
            clipboard.clear();
        }
        // 创建缓存对象
    store(type = 'text', cacheKey = "default") {
            if (!this.clipboardStore) this.clipboardStore = new Store(`clipboardListener_${type}_${cacheKey}`);;
            return this.clipboardStore
        }
        // 得到缓存的结果
    async getAllStore(type = 'text', cacheKey = "default") {
            if (!this.clipboardStore) this.clipboardStore = this.store(type, cacheKey);
            return new Promise((resolve, reject) => {
                this.clipboardStore.getJson().then(res => resolve(res));
            });
        }
        // 清空缓存
    clearStore(type = 'text', cacheKey = "default") {
            if (!this.clipboardStore) this.clipboardStore = this.store(type, cacheKey);
            this.clipboardStore.clear();
        }
        //剪切板监听
    listener(type = 'text', fn = null, cacheKey = "default", interval = 2000) {
        if (this.clipboardListenerStop == true) return;
        this.store(type, cacheKey);
        // console.log(this.clipboardStore)
        let data = this.read(type);
        let id = md5(
            type == 'img' && data ?
            data.toDataURL() :
            (data || '')
        );

        if (data && this.clipboardListenerData != id) {
            if (fn) fn((type == 'img' && data ? data.toDataURL() : data), id);
            this.clipboardListenerData = id;
            if (type == 'img' && data) {
                let resizeImg = data.resize({ height: 18 });
                _APPICON.setImage(resizeImg);
            };

            // 缓存
            // Store the value 'data' at key 'id'
            if (type == 'img') data = data.toDataURL();

            this.clipboardStore.set(id, data);

        };
        // 
        setTimeout(() => {
            this.listener(type, fn);
        }, interval);
    }
}

module.exports = Clipboard;