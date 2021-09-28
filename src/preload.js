// preload.js
const Lab = require('./lab/index');


process.once('loaded', () => {
    global.Lab = {};
    for (const key in Lab) {
        global.Lab[key] = Lab[key];
    }
});

// ipcRenderer.send('preview-ready', true);

// window.addEventListener('load', init);