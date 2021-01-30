//用于捕捉erro的情况，回传
const { ipcRenderer, remote } = require("electron");
var mainWindow = (remote.getGlobal("_WINS")).mainWindow;