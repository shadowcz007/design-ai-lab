/* 渲染进程
 */
const { ipcRenderer } = require("electron");
const GUI = require('./gui');

GUI.init();

//打开文件
ipcRenderer.on("open-file", () => GUI.openFileFn());
//编辑/预览 切换
ipcRenderer.on("edit-file", (event, arg) => GUI.editFileFn(arg.hardReadOnly));
//新建
ipcRenderer.on("new-file", () => GUI.newFileFn());
//保存
ipcRenderer.on("save-file", () => GUI.saveFileFn());
//关闭
ipcRenderer.on("close-file", () => GUI.closeFn());
//发布
ipcRenderer.on("public-file", () => GUI.pubilcFn());
// 调试
ipcRenderer.on("open-devtools", () => GUI.openPreviewDev());

//显示代码错误
ipcRenderer.on("executeJavaScript-result", () => GUI.onPreviewWindowError());


// const U2net=require('./u2net');
// new U2net();