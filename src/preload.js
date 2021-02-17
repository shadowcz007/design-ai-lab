// preview 
function init() {
    //AI功能封装
    const { Lab, cv } = require('./lab');
    window.Lab = Lab;
    window.cv = cv;
    // ipcRenderer.send('preview-ready', true);
}
window.addEventListener('load', init);