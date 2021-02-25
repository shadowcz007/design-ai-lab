/**
 * browsewindow的封装
 */

const { remote } = require("electron");


class Win {
    constructor() {
        this.executeJSNow=window.performance.now();
        this.workAreaSize = remote.screen.getPrimaryDisplay().workAreaSize;
        this.previewWindow = (remote.getGlobal("_WINS")).previewWindow;
        this.mainWindow = (remote.getGlobal("_WINS")).mainWindow;
        // this.previewWindow.webContents.on('context-menu', (event, params) => {
        //     console.log('context-menu', event, params)
        // })
        // 用来优化console的显示消息
        // this.previewWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        //     console.log('console-message', event, level, message, line, sourceId)
        // })
        // 监听加载事件，然后注入代码
        this.previewWindow.webContents.on('did-finish-load', () => {
            this.previewWindow.webContents.executeJavaScript(this.code, false).then(()=>{
                this.previewWindow.setTitle("更新成功");
            })
        });
        // 当preview窗口崩溃的时候
        this.previewWindow.webContents.on('render-process-gone', (event, details) => {
            console.log('render-process-gone', event, details);
            this.previewWindow.reload();
        });
        this.previewWindow.webContents.on('unresponsive', (event, details) => {
            console.log('unresponsive', event, details);
        });

    }

    edit() {
        let previewWindow = this.get(1);
        previewWindow.setResizable(true);
        previewWindow.setClosable(true);
    }

    public() {
        let previewWindow = this.get(1);
        previewWindow.setResizable(false);
        previewWindow.setClosable(false);
    }
    resize(size, whichWin = 1) {
        //预览窗口的尺寸更新
        let win = this.get(whichWin);
        // res.size
        if (size) {
            this.show(1, true);
            win.setSize(...size);
        };
    }
    move(t = 'topRight', whichWin = 1) {
            let win = this.get(whichWin);
            let size = win.getSize();
            if (t === 'topRight') {
                let x = this.workAreaSize.width - size[0],
                    y = 0;
                win.setPosition(x, y);
            }
        }
        //仅显示主窗口,
        //仅显示预览窗口
    showWinControl(mShow = true, pShow = true) {
        this.show(0, mShow);
        this.show(1, pShow);
    }

    show(type = 0, show = true) {
        let win = this.get(type);
        if (win && win.isVisible() !== show) show == true ? win.show() : win.hide();
    }

    //动态改变系统托盘菜单
    //items=[ { label,click} ]
    changeAppIcon(items = []) {
        if (items.length == 0) return;
        let contextMenu = remote.Menu.buildFromTemplate(items);
        remote.getGlobal('_APPICON').setContextMenu(contextMenu);
    }

    get(w = 0) {
        if (w === 0) {
            this.mainWindow = this.mainWindow || (remote.getGlobal("_WINS")).mainWindow;
            return this.mainWindow
        } else {
            this.previewWindow = this.previewWindow || (remote.getGlobal("_WINS")).previewWindow;
            return this.previewWindow
        }
    }

    //窗口状态
    // 0 主窗口 1 主窗口 预览窗口 2 预览窗口
    getWindowStatus(status = 0) {
            let previewWindow = this.get(1),
                mainWindow = this.get(0);
            return {
                status: status,
                size: previewWindow.getSize(),
                mainWindow: {
                    show: mainWindow.isVisible(),
                    bound: mainWindow.getBounds()
                }
            }
        }
    // 检查间隔时间
    checkTime(){
        let previewWindow = this.get(1);
        let n=window.performance.now();
        if(Math.abs(n-this.executeJSNow)<1500){
            // 间隔较短
            // console.log("间隔较短")
            previewWindow.setTitle("输入ing");
            setTimeout(()=>{
                this.checkTime(n);
            },1500);
        }else{
            // console.log("间隔时间可以")
            previewWindow.setTitle("更新ing");
            this.show(1, true);
            if(!previewWindow.webContents.isLoading()) {
                previewWindow.webContents.reload()
            };
        }
    }
        //注入代码
    executeJavaScript2Preview(code) {
        this.code = code;
        this.executeJSNow=window.performance.now();
        this.checkTime();
        // let previewWindow = this.get(1);
        // this.show(1, true);
        // if(!previewWindow.webContents.isLoading()) previewWindow.webContents.reload();
    };



};

module.exports = new Win();