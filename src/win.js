/**
 * browsewindow的封装
 */

const { remote } = require("electron");
const runtime = require('./runtime');

class Win {
    constructor() {
        // 统计输入时间间隔
        this.exTimes = [];
        // 代码id
        this.codeId = null;
        // 代码
        this.code = "";
        // 是否已注入
        this.codeFinish = true;

        // 自动更新
        this.isAuto = true;

        this.executeJSNow = window.performance.now();
        this.workAreaSize = remote.screen.getPrimaryDisplay().workAreaSize;
        this.previewWindow = (remote.getGlobal("_WINS")).previewWindow;
        this.mainWindow = (remote.getGlobal("_WINS")).mainWindow;

        // 监听加载事件，然后注入代码
        this.previewWindow.webContents.on('did-finish-load', async () => {
            // console.log(this.codeFinish )
            try {
                if (this.codeFinish === false) {
                    await this.previewWindow.webContents.executeJavaScript(this.code, false);
                    this.codeFinish = true;
                    this.statusSuccess();
                    // .then(() => {
                    //     this.codeFinish = true;
                    //     this.statusSuccess();
                    // }).catch(e => {
                    //     console.log(e, this.code)
                    // })
                } else {
                    this.statusSuccess();
                }
            } catch (error) {
                console.log(error);
                this.statusError();
            }

        });
        // 当preview窗口崩溃的时候
        this.previewWindow.webContents.on('render-process-gone', (event, details) => {
            console.log('render-process-gone', event, details);
            this.previewWindow.reload();
        });
        this.previewWindow.webContents.on('unresponsive', (event, details) => {
            console.log('unresponsive', event, details);
        });

        this.callback = null;

        // 点击小图标显示窗口
        remote.getGlobal('_APPICON').addListener('click', () => {
            if (this.mShow) {
                this.get(0).focus();
                this.get(0).moveTop();
            };
            if (this.pShow) {
                this.get(1).focus();
                this.get(1).moveTop();
            };
        });

        this.mShow = false;
        this.pShow = false;
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
            // this.show(whichWin, true);
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
        if (win && win.isVisible() !== show) {
            show == true ? win.show() : win.hide();
            if (type == 0) this.mShow = show;
            if (type == 1) this.pShow = show;
        }
    }


    //动态改变系统托盘菜单
    //items=[ { label,click} ]
    changeAppIcon(items = []) {
        //if (items.length == 0) return;
        let app = remote.getGlobal('_APPICON');
        let m = app.contextMenu;
        app.setContextMenu(
            remote.Menu.buildFromTemplate([
                ...m.items,
                { type: 'separator' },
                ...items]));

        //let contextMenu = remote.Menu.buildFromTemplate(items);
        // remote.getGlobal('_APPICON').setContextMenu(contextMenu);
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

    getMainBound() {
        let mainWindow = this.get(0);
        let bounds = mainWindow.getBounds();
        localStorage.setItem('_mainbound', JSON.stringify(bounds));
        console.log(bounds.height)
        return bounds
    }

    setMainBound() {
        try {
            let bounds = localStorage.getItem('_mainbound');
            bounds = JSON.parse(bounds);
            this.resize([bounds.width, bounds.height], 0);
        } catch (error) {

        };
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

    statusError() {
        this.get(1).setTitle("错误");
        // console.log('#JS:完成',this.callback)
        if (this.callback) this.callback('#JS:错误');
    }

    statusSuccess() {
        this.get(1).setTitle("更新成功");
        // console.log('#JS:完成',this.callback)
        if (this.callback) this.callback('#JS:完成');
    }
    statusChecking() {
        this.get(1).setTitle("输入ing");
        // console.log('#JS:检查中')
        if (this.callback) this.callback('#JS:检查中');
    }
    statusInjecting() {
        this.get(1).setTitle("更新ing");
        // console.log('#JS:注入中');
        if (this.callback) this.callback('#JS:注入中');
    }


    // 检查间隔时间
    checkTime() {
        let previewWindow = this.get(1);
        let n = window.performance.now();
        // 统计时间间隔
        this.exTimes.push(Math.abs(n - this.executeJSNow));
        // 计算时间间隔的平均值
        let ts = this.exTimes.slice(this.exTimes.length - 10, this.exTimes.length)

        let setTime = 4000 - Math.min(ts.reduce((a, b) => a + b) / ts.length, 3000);
        console.log(
            ts.reduce((a, b) => a + b) / ts.length,
            `间隔较短 ${Math.abs(n - this.executeJSNow) < setTime}`,
            `this.codeFinish ${this.codeFinish}`);

        if (this.codeFinish === true) return this.statusSuccess();

        this.statusChecking();
        if (Math.abs(n - this.executeJSNow) < setTime) {
            // 间隔较短
            setTimeout(() => {
                this.checkTime();
            }, setTime);
        } else {
            console.log(!previewWindow.webContents.isLoading(), this.codeFinish)
            // this.show(1, true);
            if (!previewWindow.webContents.isLoading() && this.codeFinish === false) {
                this.statusInjecting();
                previewWindow.webContents.reload();
            };
        }
    }
    //注入代码
    executeJavaScript2Preview(code, forceRun = false) {
        if (this.isAuto === false && forceRun === false) return;
        let isNew = false;
        let id = runtime.hash(code);
        console.log('executeJavaScript2Preview-forceRun', forceRun)
        if (forceRun === true) {
            isNew = true;
            this.codeFinish = true;
        };
        //上次一次代码的记录
        if (!this.codeId) {
            this.codeId = id;
            isNew = true;
        } else {
            if (this.codeId !== id) {
                this.codeId = id;
                isNew = true;
            }
        };

        console.log('isNew', isNew, this.codeFinish)
        if (isNew === true && this.codeFinish === true) {
            this.codeFinish = false;
            this.codeId = id;
            this.code = code;
            this.executeJSNow = window.performance.now();
            this.checkTime();
        }

    };

    stopExecuteJavaScript2Preview() {
        this.isAuto = false;
    }
    startExecuteJavaScript2Preview() {
        this.isAuto = true;
    }

    resetPreview() {
        this.codeId = null;
        this.codeFinish = true;
        return this.previewWindow.reload();
    }

    capturePage(w = 1) {
        let win = this.get(w);
        let im;
        // 截图之前需要确认窗口是否显示了
        if (win.isVisible()) im = win.webContents.capturePage();
        console.log(im)
        //截图
        return im
    }

};

module.exports = new Win();