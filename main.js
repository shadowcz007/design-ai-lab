const { app, BrowserWindow, screen, ipcMain, Tray, Menu, dialog } = require('electron');
const path = require('path');
const storage = require('electron-json-storage');
const openAboutWindow = require('about-window').default;

const _package = require("./package.json");
// console.log(package);
global._PACKAGE = JSON.parse(JSON.stringify(_package));

const dataPath = storage.getDataPath();
// console.log(dataPath,path.join(dataPath, "db.json"));
global._DBPATH = path.join(dataPath, "db.json");

//平台
const _IS_MAC = process.platform === 'darwin';

//全局变量
global._WINS = {};
global._APPICON = null;

const _INDEX_HTML = path.join(__dirname, 'src/index.html');
const _PRE_HTML = path.join(__dirname, 'src/preview.html');
const _READ_HTML = path.join(__dirname, 'src/read.html');
// const _READ_HTML='https://translate.google.cn/?hl=zh-CN&tab=TT&sl=auto&tl=zh-CN&op=docs'
const _PRELOAD_JS = path.join(__dirname, 'src/preload.js');

global._DEBUG_PORT = 3000;

app.commandLine.appendSwitch('remote-debugging-port', global._DEBUG_PORT);
app.commandLine.appendSwitch('remote-debugging-address', 'http://127.0.0.1');

// app.commandLine.appendSwitch(
// 	"js-flags",
// 	// WebAssembly flags
// 	"--experimental-wasm-threads --experimental-wasm-bulk-memory"
// );
// app.allowRendererProcessReuse = true; // https://github.com/electron/electron/issues/18397


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
        alwaysOnTop: true,
        closable: false,
        resizable: true,
        titleBarStyle: "default",
        html: _PRE_HTML,
        preload: _PRELOAD_JS
    },
    // readWindow: {
    //     width: 800,
    //     height: 600,
    //     minHeight: 400,
    //     minWidth: 500,
    //     align: 'topLeft',
    //     title: "阅读",
    //     show: true,
    //     closable: true,
    //     resizable: true,
    //     titleBarStyle: "default",
    //     html: _READ_HTML
    // },
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
        // movable:opts.movable!=undefined ? opts.movable:true,
        alwaysOnTop: opts.alwaysOnTop || false,
        closable: opts.closable,
        resizable: opts.resizable,
        titleBarStyle: opts.titleBarStyle,
        webPreferences: {
            preload: opts.preload,
            //开启nodejs支持
            nodeIntegration: true,
            //开启AI功能
            experimentalFeatures: true,
            //开启渲染进程调用remote
            enableRemoteModule: true,
            webviewTag: true,
            devTools: true
        }
    });

    // 加载xxx.html
    if (opts.html.match("https://")) {
        win.loadURL(opts.html);
    } else {
        win.loadFile(opts.html);
    }

    // 打开调试工具
    if (process.env.NODE_ENV === 'development') win.webContents.openDevTools();
    // console.log(opts)
    win.webContents.once("did-finish-load", () => {
        opts.show === true ? win.show() : null;
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
    if (config.mainWindow) {
        config.mainWindow.height = workAreaSize.height;
        config.mainWindow.width = workAreaSize.width - config.previewWindow.width - 20;
    };

    storage.get('app', function(error, data) {
        console.log('storage', data)
        if (error) throw error;
        //是否发布，发布了，主窗口将隐藏
        //  0 主窗口 1 主窗口 预览窗口 2 预览窗口
        if (data && (data.status === 2 || data.status === 1)) {
            if (config.mainWindow) config.mainWindow.show = (data.status === 1);
            if (config.previewWindow) {
                config.previewWindow.show = !!data.executeJavaScript;
                config.previewWindow.closable = true;
                config.previewWindow.executeJavaScript = data.executeJavaScript;
                config.previewWindow.width = data.size[0];
                config.previewWindow.height = data.size[1];
                config.previewWindow.resizable = false;
                // config.previewWindow.movable=true;
                config.previewWindow.alwaysOnTop = true;
                config.previewWindow.title = '';
            };
        } else if (data && data.status === 0) {
            //主窗口显示在欢迎界面
            //初始状态在 欢迎界面
            if (config.mainWindow) config.mainWindow.executeJavaScript = `window.addEventListener('load',GUI.closeFn);`;
        };
        for (const key in config) {
            if (!global._WINS[key]) createWindow(key, config[key], workAreaSize);
        }
    });

};


function initAppIcon() {
    global._APPICON = new Tray(path.join(__dirname, "assets/appIcon.png"));
    const contextMenu = Menu.buildFromTemplate([{
        label: '编辑',
        type: 'normal',
        checked: false,
        click: async() => {
            global._WINS.mainWindow.webContents.send('edit-file', { hardReadOnly: true });
        }
    }]);


    global._APPICON.setContextMenu(contextMenu);
    global._APPICON.setToolTip('智能设计');
    // return contextMenu
}

function initMenu() {

    const template = [
        // { role: 'appMenu' }
        ...(_IS_MAC ? [{
            label: _package.name,
            submenu: [{
                    label: '关于',
                    click: () =>
                        openAboutWindow({
                            icon_path: path.join(__dirname, 'logo.png'),
                            product_name: 'Design.ai Lab',
                            copyright: 'Copyright (c) 2021 shadow',
                            adjust_window_size: true,
                            bug_link_text: "反馈bug",
                            package_json_dir: __dirname,
                            open_devtools: process.env.NODE_ENV === 'development',
                            css_path: path.join(__dirname, 'src/style.css'),
                        }),
                },
                { type: 'separator' },
                // {
                //     label: '反馈',
                //     click: async() => {
                //         const { shell } = require('electron')
                //         await shell.openExternal('https://electronjs.org')
                //     }
                // },
                // { type: 'separator' },
                // { role: 'hide' },
                // { role: 'hideothers' },
                // { role: 'unhide' },
                // { type: 'separator' },
                { role: 'quit', label: '退出' }
            ]
        }] : []),
        // { role: 'fileMenu' }
        {
            label: '文件',
            submenu: [{
                    label: '打开',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => global._WINS.mainWindow.webContents.send('open-file')
                },
                {
                    label: '新建',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => global._WINS.mainWindow.webContents.send('new-file')
                },
                {
                    label: '另存为',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => global._WINS.mainWindow.webContents.send('save-file')
                },
                { type: 'separator' },
                {
                    label: '编辑',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => global._WINS.mainWindow.webContents.send('edit-file', { hardReadOnly: false })
                },
                {
                    label: '发布',
                    accelerator: 'CmdOrCtrl+P',
                    click: () => global._WINS.mainWindow.webContents.send('public-file')
                },
                { type: 'separator' },
                {
                    label: '重启',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        app.relaunch();
                        app.exit();
                    }
                },
                { type: 'separator' },
                {
                    label: '关闭',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => global._WINS.mainWindow.webContents.send('close-file')
                }
            ]
        },
        //{ role: 'editMenu' },
        {
            //role: 'editMenu',
            label: '编辑',
            submenu: [{
                    label: '撤销',
                    accelerator: 'CmdOrCtrl+Z',
                    role: 'undo'
                },
                {
                    label: '重做',
                    accelerator: 'Shift+CmdOrCtrl+Z',
                    role: 'redo'
                },
                {
                    type: 'separator'
                },
                {
                    label: '剪切',
                    accelerator: 'CmdOrCtrl+X',
                    role: 'cut'
                },
                {
                    label: '拷贝',
                    accelerator: 'CmdOrCtrl+C',
                    role: 'copy'
                },
                {
                    label: '粘贴',
                    accelerator: 'CmdOrCtrl+V',
                    role: 'paste'
                },
                {
                    label: '全选',
                    accelerator: 'CmdOrCtrl+A',
                    role: 'selectall'
                },
            ]
        },
        // {
        //     label: '模式',
        //     submenu: modeMenu.items
        // },
        // {
        //     role: 'windowMenu'
        // },
        {
            label: '窗口',
            role: 'window',
            submenu: [{
                label: '最小化',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            }]
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

// ipcMain.on('preview-ready', (event, arg) => {
//     console.log('preview-ready')
// });
// app.commandLine.appendSwitch('enable-experimental-web-platform-features');

// 当应用完成初始化后
app.whenReady().then(() => {
    initAppIcon()
    initMenu();
    initWindow();
    app.on('activate', function() {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) initWindow()
    });
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') app.quit()
});