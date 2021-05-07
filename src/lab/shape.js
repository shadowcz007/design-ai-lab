// 形态分类
// 三角形、方形、圆形、倒三角、

const Store = require('./store');

// match shape
class Shape {
    constructor() {
        this.store = new Store('my_shape');
    }

    // 
    findContoursForImgsBatch(imgs = []) {
        let res = [];
        for (const im of imgs) {
            let cs = this.findContoursForImg(im);
            res.push(cs);
        };
        return res
    };

    // 透明图的边缘识别
    getBoundingRect(im) {
        let {
            src,
            dst
        } = this.initProcess(im);
        // 灰度
        cv.cvtColor(src, dst, cv.COLOR_RGB2GRAY, 0);
        let { contours, hierarchy } = this.findContours(dst);
        let res = this.getRectangles(contours)[0];
        dst.delete();
        src.delete();
        contours.delete();
        hierarchy.delete();
        return res
    }

    // 
    findContoursForImg(im) {
        let {
            src,
            dst
        } = this.initProcess(im);
        // 灰度
        cv.cvtColor(src, dst, cv.COLOR_RGB2GRAY, 0);
        let { contours, hierarchy } = this.findContours(dst);
        let c = this.contourSave(contours.get(0));
        // let res = this.getRectangles(contours);
        dst.delete();
        src.delete();
        contours.delete();
        hierarchy.delete();
        return c
    }

    // 初始化
    initProcess(img) {
        //创建画布

        let canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        let src = cv.imread(img);
        // 空的
        // let dst = new cv.Mat();
        // 黑图
        let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        // let dst=cv.imread(img);
        return {
            src,
            dst,
            canvas
        }
    }

    // 寻找轮廓
    findContours(src) {
            // 轮廓
            let contours = new cv.MatVector();

            // 层级 [Next, Previous, First_Child, Parent]
            let hierarchy = new cv.Mat();

            // 模式
            let mode = cv.RETR_EXTERNAL;
            // cv.RETR_TREE 取回所有的轮廓并且创建完整的家族层级列表
            // cv.RETR_CCOMP 获取所有轮廓并且把他们组织到一个2层结构里
            // cv.RETR_EXTERNAL 返回最外层的,所有孩子轮廓都不要
            // cv.RETR_LIST 获取所有轮廓，但是不建立父子关系

            let method = cv.CHAIN_APPROX_SIMPLE;
            // CHAIN_APPROX_NONE：获取每个轮廓的每个像素，相邻的两个点的像素位置差不超过1
            // CHAIN_APPROX_SIMPLE：压缩水平方向，垂直方向，对角线方向的元素，值保留该方向的重点坐标，如果一个矩形轮廓只需4个点来保存轮廓信息
            // CHAIN_APPROX_TC89_L1和CHAIN_APPROX_TC89_KCOS使用Teh-Chinl链逼近算法中的一种
            /**
             * 如果传递cv.CHAIN_APPROX_NONE，则将存储所有边界点。但是实际上我们需要所有这些要点吗？
             * 例如，您找到了一条直线的轮廓。您是否需要线上的所有点代表该线？
             * 不，我们只需要该线的两个端点即可。
             * 这就是cv.CHAIN_APPROX_SIMPLE所做的。
             * 它删除所有冗余点并压缩轮廓，从而节省内存。
             */
            cv.findContours(src, contours, hierarchy, mode, method);

            return { contours, hierarchy };
        }
        //  比较两个轮廓
    matchShape(contours1, contours2) {
        let result = cv.matchShapes(contours1.get(0), contours2.get(0), 1, 0);
        // contours1.delete();
        // contours2.delete();
        return result;
    }

    // Sort rectangles 从大到小
    compareRect(b, a) {
        return a.width * a.height - b.width * b.height
    }

    // 从轮廓计算矩形
    getRectangles(contours) {
        let rectangles = [];
        // Extract rectangle from each contour.
        for (let i = 0; i < contours.size(); ++i) {
            rectangles.push(cv.boundingRect(contours.get(i)));
        }
        return rectangles.sort(this.compareRect);
    }

    contourSave(contour) {

        let cnt = contour;
        // 近似轮廓
        let tmp = new cv.Mat();
        cv.approxPolyDP(cnt, tmp, 12, true);
        // console.log(cnt)
        let res = {
            rows: tmp.rows,
            cols: tmp.cols,
            type: tmp.type(),
            // 长度不等
            array: tmp.data32S
        };
        tmp.delete();

        return res;
    };

    // 保存
    contoursSave(contours) {
        let res = [];
        for (let i = 0; i < contours.size(); i++) {
            let cnt = contours.get(i);
            res.push(this.contourSave(cnt));
        };
        return res;
    };
    // 读取
    contoursLoad(array = []) {
        let matVec = new cv.MatVector();
        for (let i = 0; i < array.length; i++) {
            let a = array[i]
            let mat = cv.matFromArray(a.rows, a.cols, a.type, a.array);
            matVec.push_back(mat);
        };
        return matVec
    }
}


module.exports = Shape;