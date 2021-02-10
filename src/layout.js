
const Muuri = require("muuri");

class Layout{
    constructor(){
        // 布局
        this.init();
    }
    grid(){
        return this.grid
    }
    init(dragEnabled=true){
        document.querySelector('.grid').style.display='inherit';
        document.querySelector('#editor-pannel').style.position='absolute';
        document.querySelector('#knowledge-pannel').style.position='absolute';
        this.grid = this.initGrid(dragEnabled);
    }
    destroy(){
        if(this.grid) {
            this.grid.destroy();
        };
        document.querySelector('.grid').style.display='flex';
        document.querySelector('#editor-pannel').style.position='inherit';
        document.querySelector('#knowledge-pannel').style.position='inherit';
    }
    reset(){
        this.destroy();
        this.init();
    }
    clearAndReset(){
        localStorage.removeItem('layout');
        this.reset();
    }
    dragEnabled(dragEnabled=true){
        this.destroy();
        this.init(dragEnabled);
    }
    //初始化布局
    initGrid(dragEnabled = true) {
        try {
            let _grid = new Muuri('.grid', {
                dragEnabled: dragEnabled,
                layoutOnInit: false
            }).on('move',()=> {
                //缓存布局
                this.saveLayout(_grid);
            });
            //读取布局缓存
            let layout = window.localStorage.getItem('layout');
            if (layout) {
                //恢复布局
                this.loadLayout(_grid, layout);
            } else {
                _grid.layout(true);
            };

            window.addEventListener('load', () => _grid.refreshItems().layout());
            _grid.refreshItems().layout();
            //拖放布局结束
            // _grid.on('dragReleaseEnd', console.log);

            return _grid;

        } catch (error) {
            // console.log(error)
            return this.grid;
        };

    }

    serializeLayout(grid) {
        var itemIds = grid.getItems().map(function(item) {
            return item.getElement().getAttribute('data-id');
        });
        return JSON.stringify(itemIds);
    }

    saveLayout(grid) {
        var layout = this.serializeLayout(grid);
        window.localStorage.setItem('layout', layout);
    }   

    loadLayout(grid, serializedLayout) {
        var layout = JSON.parse(serializedLayout);
        var currentItems = grid.getItems();
        var currentItemIds = currentItems.map(function(item) {
            return item.getElement().getAttribute('data-id')
        });
        var newItems = [];
        var itemId;
        var itemIndex;

        for (var i = 0; i < layout.length; i++) {
            itemId = layout[i];
            itemIndex = currentItemIds.indexOf(itemId);
            if (itemIndex > -1) {
                newItems.push(currentItems[itemIndex])
            }
        }

        grid.sort(newItems, { layout: 'instant' });
    };  
}

module.exports =new Layout();