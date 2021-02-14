/**
 * browsewindow的封装
 */

const { remote } = require("electron");


class Win {
    constructor() {
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
            this.previewWindow.webContents.executeJavaScript(this.code, false);
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
        //注入代码
    executeJavaScript2Preview(code) {
        this.code = code;
        let previewWindow = this.get(1);
        this.show(1, true);
        previewWindow.webContents.reload();
    };



};

module.exports = new Win();