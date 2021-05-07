// flex布局计算
const path = require('path');
const Yoga = require('yoga-layout-wasm');
const wasmFilePath = path.join(__dirname, '../node_modules/yoga-layout-wasm/dist/yoga.wasm')


class FlexLayout {
    constructor() {
        this._ = Yoga;

    }
    init() {
        return new Promise((resolve, reject) => {
            Yoga.init(wasmFilePath).then(() => {
                const Node = Yoga.Node;
                this.Node = Node;
                const root = Node.create();
                root.setWidth(500);
                root.setHeight(300);
                root.setJustifyContent(Yoga.JUSTIFY_CENTER);

                const node1 = Node.create();
                node1.setWidth(100);
                node1.setHeight(100);

                const node2 = Node.create();
                node2.setWidth(100);
                node2.setHeight(100);

                root.insertChild(node1, 0);
                root.insertChild(node2, 1);

                root.calculateLayout(500, 300, Yoga.DIRECTION_LTR);
                console.log(root.getComputedLayout());
                // {left: 0, top: 0, width: 500, height: 300}
                console.log(node1.getComputedLayout());
                // {left: 150, top: 0, width: 100, height: 100}
                console.log(node2.getComputedLayout());
                // {left: 250, top: 0, width: 100, height: 100}
                resolve();
            });
        });

    }

    // 自动拼图
    masonry(width = 500, height = 300, list = []) {

        // let padding=12;
        const root = this.Node.create();
        root.setWidth(width);
        root.setHeight(height);
        root.setFlexWrap(Yoga.WRAP_WRAP);
        root.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        // root.setPadding(padding,padding);
        // var list = [{
        //     width: 100,
        //     height: 100
        // }, {
        //     width: 10, height: 50
        // }];

        list.forEach((li, i) => {
            const node = this.Node.create();
            node.setWidth(li.width);
            node.setHeight(li.height);
            node.setFlexGrow(1);
            // node.setMargin(padding, padding);
            root.insertChild(node, i);
            list[i].node = node;
            li.node.calculateLayout();
        });

        root.calculateLayout(width, height);

        let styles = [];
        let mainStyle = {
            left: 0,
            top: 0,
            width: 0,
            height: 0
        };
        let add = 0,
            preTop = 0;
        list.forEach((li, i) => {
            let style = li.node.getComputedLayout();
            // console.log(style)
            // if(preTop!=style.top) add++ && (preTop=style.top);
            // style.top += padding*(add+1);
            mainStyle.height = Math.max(mainStyle.height, style.top + style.height);
            mainStyle.width = Math.max(mainStyle.width, style.left + style.width);
            styles.push(style);
        });
        return {
            mainStyle,
            styles
        }
    }
}


module.exports = FlexLayout;