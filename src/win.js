
/**
 * browsewindow的封装
 */

const { remote } = require("electron");

class Win{
    constructor(){
        this.previewWindow=(remote.getGlobal("_WINS")).previewWindow;
        this.mainWindow =(remote.getGlobal("_WINS")).mainWindow;
    }

    edit(){
        let previewWindow=this.get(1);
        previewWindow.setResizable(true);
        previewWindow.setClosable(true);
    }

    public(){
        let previewWindow=this.get(1);
        previewWindow.setResizable(false);
        previewWindow.setClosable(false);
    }
    resize(size,whichWin=1){
        //预览窗口的尺寸更新
        let win = this.get(whichWin);
        // res.size
        if(size){ 
            this.show(1,true);
            win.setSize(...size);
        };
    }

    //仅显示主窗口,
    //仅显示预览窗口
    showWinControl(mShow = true, pShow = true) {
        this.show(0,mShow);
        this.show(1,pShow);
    }

    show(type=0,show=true){
        let win=this.get(type);
        if(win) if (win.isVisible() !== show) show == true ? win.show() : win.hide();
    }

    //动态改变系统托盘菜单
    //items=[ { label,click} ]
    changeAppIcon(items = []) {
        if (items.length == 0) return;
        let contextMenu = remote.Menu.buildFromTemplate(items);
        remote.getGlobal('_APPICON').setContextMenu(contextMenu);
    }

    get(w=0){
        if(w===0){
            this.mainWindow = this.mainWindow || (remote.getGlobal("_WINS")).mainWindow;
            return this.mainWindow
        }else{
            this.previewWindow = this.previewWindow || (remote.getGlobal("_WINS")).previewWindow;
            return this.previewWindow
        }
    }

    //窗口状态
    // 0 主窗口 1 主窗口 预览窗口 2 预览窗口
    getWindowStatus(status = 0){
        let previewWindow=this.get(1),
            mainWindow=this.get(0);
        return {
            status: status,
            size: previewWindow.getSize(),
            mainWindow: {
                show: mainWindow.isVisible(),
                bound: mainWindow.getBounds()
            }
        }
    }

    

    
};

module.exports=new Win();