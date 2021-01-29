const { ipcRenderer, remote } = require("electron");
var mainWindow = (remote.getGlobal("_WINS")).mainWindow;