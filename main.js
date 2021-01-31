const { app, BrowserWindow, screen, ipcMain, Tray, Menu, } = require('electron');
const path = require('path');
const storage = require('electron-json-storage');

const package = require("./package.json");
// console.log(package);

// const dataPath = storage.getDataPath();
// console.log(process);
//平台
const _IS_MAC = process.platform === 'darwin';

//全局变量
global._WINS = {};

const _INDEX_HTML = path.join(__dirname, 'src/index.html');
const _PRE_HTML = path.join(__dirname, 'src/preview.html');
const _PRELOAD_JS = path.join(__dirname, 'src/preload.js');

let appIcon;

const config = {
    mainWindow: {
        width: 800,
        height: 600,
        minHeight: 400,
        minWidth: 500,
        align: 'topLeft',
        title: "实验",
        show: true,
        closable: true,
        resizable: true,
        titleBarStyle: "default",
        html: _INDEX_HTML
    },
    previewWindow: {
        width: 400,
        height: 400,
        minHeight: parseInt(400 * 0.8),
        minWidth: parseInt(400 * 0.8),
        align: 'topRight',
        title: "预览",
        show: false,
        closable: false,
        resizable: true,
        titleBarStyle: "hiddenInset",
        html: _PRE_HTML
    }
}

function createWindow(key, opts, workAreaSize) {
    // 创建GUI窗口
    const win = new BrowserWindow({
        width: opts.width,
        height: opts.height,
        minHeight: opts.minHeight,
        minWidth: opts.minWidth,
        x: opts.align == "topRight" ? workAreaSize.width - opts.width : 0,
        y: 0,
        title: opts.title || "-",
        show: false,
        closable: opts.closable,
        resizable: opts.resizable,
        titleBarStyle: opts.titleBarStyle,
        webPreferences: {
            preload: _PRELOAD_JS,
            //开启nodejs支持
            nodeIntegration: true,
            //开启AI功能
            experimentalFeatures: true,
            //开启渲染进程调用remote
            enableRemoteModule: true
        }
    });

    // 加载xxx.html
    win.loadFile(opts.html);
    // 打开调试工具
    win.webContents.openDevTools();
    if (opts.show === true) win.webContents.once("dom-ready", () => {
        win.show();
        opts.executeJavaScript ? win.webContents.executeJavaScript(opts.executeJavaScript, false) : null;
    });
    win.on("closed", () => {
        for (const key in global._WINS) {
            global._WINS[key].destroy()
        };
        app.quit();
    });
    global._WINS[key] = win;
    return win;
};

function initWindow() {
    const workAreaSize = screen.getPrimaryDisplay().workAreaSize;
    config.mainWindow.height = workAreaSize.height;
    config.mainWindow.width = workAreaSize.width - config.previewWindow.width - 20;

    storage.get('app', function(error, data) {
        if (error) throw error;
        //是否发布，发布了，主窗口将隐藏
        if (data && data.public === 1) {
            config.mainWindow.show = false;
            config.previewWindow.show = true;
            config.previewWindow.closable = true;
            config.previewWindow.executeJavaScript = data.executeJavaScript;
            config.previewWindow.width = data.size[0];
            config.previewWindow.height = data.size[1];
            config.previewWindow.resizable = false;
        }
        for (const key in config) {
            if (!global._WINS[key]) createWindow(key, config[key], workAreaSize);
        }
    });

};


function initAppIcon() {
    appIcon = new Tray(path.join(__dirname, "assets/appIcon.png"));
    const contextMenu = Menu.buildFromTemplate([{
            label: '编辑',
            type: 'normal',
            checked: false,
            click: async() => {
                global._WINS.mainWindow.show();
                global._WINS.previewWindow.setClosable(false);
                global._WINS.previewWindow.setResizable(true);
            }
        }, {
            label: '发布',
            type: 'normal',
            checked: false,
            click: async() => {
                global._WINS.mainWindow.webContents.send('public-file', null);

            }
        },
        // { label: '调取', type: 'radio' }
    ]);


    // Make a change to the context menu
    // contextMenu.items[0].checked = false;
    // Call this again for Linux because we modified the context menu
    appIcon.setContextMenu(contextMenu);
    appIcon.setToolTip('design.ai');

    return contextMenu.items
}

function initMenu(modeMenu) {

    const template = [
        // { role: 'appMenu' }
        ...(_IS_MAC ? [{
            label: package.name,
            submenu: [
                { role: 'about', label: `关于 v${package.version}` },
                { type: 'separator' },
                // { role: 'services' },
                // { type: 'separator' },
                // { role: 'hide' },
                // { role: 'hideothers' },
                // { role: 'unhide' },
                // { type: 'separator' },
                { role: 'quit', label: '关闭' }
            ]
        }] : []),
        // { role: 'fileMenu' }
        {
            label: '文件',
            submenu: [{
                    label: '打开',
                    click: async() => {
                        const { shell } = require('electron')
                        await shell.openExternal('https://electronjs.org')
                    }
                },
                {
                    label: '新建'
                },
                {
                    label: '另存为'
                },
                _IS_MAC ? { role: 'close', label: '关闭' } : { role: 'quit', label: '关闭' }
            ]
        },
        // { role: 'editMenu' }
        {
            label: '模式',
            submenu: modeMenu
        },
        {
            role: 'windowMenu'
        },
        {
            role: 'help',
            label: '帮助',
            submenu: [{
                label: 'Learn More',
                click: async() => {
                    const { shell } = require('electron')
                    await shell.openExternal('https://electronjs.org')
                }
            }]
        }
    ]

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

};


ipcMain.on('init-window', (event, arg) => {
    initWindow()
});

// app.commandLine.appendSwitch('enable-experimental-web-platform-features');

// 当应用完成初始化后
app.whenReady().then(() => {
    let modeMenu = initAppIcon();

    initMenu(modeMenu);

    initWindow();

    app.on('activate', function() {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) initWindow()
    })

})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') app.quit()
})