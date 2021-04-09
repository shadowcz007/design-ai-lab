/***
 * layout = new Canvas(300, 300);
   Lab.base.add(layout.getElement());

    // 双击移动到最顶部
   layout.dblclick = opt => {
        layout.moveToTop(opt.target);
    };

 */


const STATE_IDLE = 'idle';
const STATE_PANNING = 'panning';


function initSprite() {
    fabric.Sprite = fabric.util.createClass(fabric.Image, {

        type: 'sprite',
        spriteWidth: 136,
        spriteHeight: 75,
        spriteIndex: 0,
        frameTime: 50,

        initialize: function (element, options) {
            options || (options = {});

            this.spriteWidth = this.spriteWidth || this.width;
            this.spriteHeight = this.spriteHeight || this.height;
            options.width = this.spriteWidth;
            options.height = this.spriteHeight;

            this.callSuper('initialize', element, options);

            this.createTmpCanvas();
            this.createSpriteImages();
        },

        createTmpCanvas: function () {
            this.tmpCanvasEl = fabric.util.createCanvasElement();
            this.tmpCanvasEl.width = this.spriteWidth;
            this.tmpCanvasEl.height = this.spriteHeight;
        },

        createSpriteImages: function () {
            this.spriteImages = [];

            var steps = this._element.width / this.spriteWidth;
            for (var i = 0; i < steps; i++) {
                this.createSpriteImage(i);
            }
        },

        createSpriteImage: function (i) {
            var tmpCtx = this.tmpCanvasEl.getContext('2d');
            tmpCtx.clearRect(0, 0, this.tmpCanvasEl.width, this.tmpCanvasEl.height);
            tmpCtx.drawImage(this._element, -i * this.spriteWidth, 0);

            var dataURL = this.tmpCanvasEl.toDataURL('image/png');
            var tmpImg = fabric.util.createImage();

            tmpImg.src = dataURL;

            this.spriteImages.push(tmpImg);
        },

        _render: function (ctx) {
            ctx.drawImage(
                this.spriteImages[this.spriteIndex], -this.width / 2, -this.height / 2
            );
        },

        play: function () {
            var _this = this;
            this.animInterval = setInterval(() => {
                _this.onPlay && _this.onPlay();
                _this.dirty = true;
                _this.spriteIndex++;
                if (_this.spriteIndex === _this.spriteImages.length) {
                    _this.spriteIndex = 0;
                }
            }, this.frameTime);
        },

        stop: function () {
            clearInterval(this.animInterval);
        }
    });

    fabric.Sprite.fromURL = function (url, callback, imgOptions) {
        fabric.util.loadImage(url, function (img) {
            imgOptions.spriteWidth = imgOptions.spriteWidth || imgOptions.width;
            imgOptions.spriteHeight = imgOptions.spriteHeight || imgOptions.height;
            let s = new fabric.Sprite(img, imgOptions);
            s.width = imgOptions.spriteWidth;
            s.height = imgOptions.spriteHeight;
            callback(s);
        });
    };

    fabric.Sprite.async = true;
}

class Canvas {
    constructor(width = 300, height = 300, isStatic = false, isZoom = false) {
        if (!global.fabric) {
            const { fabric } = require('fabric');
            global.fabric = fabric;
            initSprite();
            this.fabric = fabric;
        }

        this.width = width;
        this.height = height;
        this.x = width / 2;
        this.y = height / 2;
        this.zoom = 0.8;
        this.isStatic = isStatic;
        this.isZoom = isZoom;
        this.dragMode = false;

        this.canvas = new fabric.Canvas(document.createElement('canvas'), {
            width: width,
            height: height,
            backgroundColor: isStatic ? 'transparent' : '#eee',
        });

        if (isZoom == true) this.canvas.on('mouse:wheel', (opt) => {
            let delta = opt.e.deltaY;
            this.zoom = this.canvas.getZoom();
            this.zoom *= 0.999 ** delta;
            if (this.zoom > 20) this.zoom = 20;
            if (this.zoom < 0.01) this.zoom = 0.01;
            this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, this.zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        if (isStatic === false) {
            this.initStyle(width / 2, height / 2, this.zoom);
            this.canvas.on('text:changed', (opt) => {
                if (this.onTextChange) this.onTextChange(opt);
            });

            this.canvas.on('object:modified', opt => {
                if (this.onModified) this.onModified(opt, this.exportJSON());
            })

            this.canvas.on('mouse:dblclick', opt => {
                if (this.dblclick) this.dblclick(opt);
                // console.log(opt)
            })
        };

        // 扩充的方法 
        // 获取缩放后的 坐标及宽高
        fabric.Rect.prototype.getScaledBound = function () {
            return {
                left: this.left,
                top: this.top,
                width: this.getScaledWidth(),
                height: this.getScaledHeight()
            }
        }

        fabric.Canvas.prototype.toggleDragMode = function (dragMode) {
            // Remember the previous X and Y coordinates for delta calculations
            let lastClientX;
            let lastClientY;
            // Keep track of the state
            let state = STATE_IDLE;
            // We're entering dragmode
            if (dragMode) {
                // Discard any active object
                this.discardActiveObject();
                // Set the cursor to 'move'
                this.defaultCursor = 'move';
                // Loop over all objects and disable events / selectable. We remember its value in a temp variable stored on each object
                this.forEachObject(function (object) {
                    object.prevEvented = object.evented;
                    object.prevSelectable = object.selectable;
                    object.evented = false;
                    object.selectable = false;
                });
                // Remove selection ability on the canvas
                this.selection = false;
                // When MouseUp fires, we set the state to idle
                this.on('mouse:up', function (e) {
                    state = STATE_IDLE;
                });
                // When MouseDown fires, we set the state to panning
                this.on('mouse:down', (e) => {
                    state = STATE_PANNING;
                    lastClientX = e.e.clientX;
                    lastClientY = e.e.clientY;
                });
                // When the mouse moves, and we're panning (mouse down), we continue
                this.on('mouse:move', (e) => {
                    if (state === STATE_PANNING && e && e.e) {
                        // let delta = new fabric.Point(e.e.movementX, e.e.movementY); // No Safari support for movementX and movementY
                        // For cross-browser compatibility, I had to manually keep track of the delta

                        // Calculate deltas
                        let deltaX = 0;
                        let deltaY = 0;
                        if (lastClientX) {
                            deltaX = e.e.clientX - lastClientX;
                        }
                        if (lastClientY) {
                            deltaY = e.e.clientY - lastClientY;
                        }
                        // Update the last X and Y values
                        lastClientX = e.e.clientX;
                        lastClientY = e.e.clientY;

                        let delta = new fabric.Point(deltaX, deltaY);
                        this.relativePan(delta);
                        //   this.trigger('moved');
                    }
                });
            } else {
                // When we exit dragmode, we restore the previous values on all objects
                this.forEachObject(function (object) {
                    object.evented = (object.prevEvented !== undefined) ? object.prevEvented : object.evented;
                    object.selectable = (object.prevSelectable !== undefined) ? object.prevSelectable : object.selectable;
                });
                // Reset the cursor
                this.defaultCursor = 'default';
                // Remove the event listeners
                this.off('mouse:up');
                this.off('mouse:down');
                this.off('mouse:move');
                // Restore selection ability on the canvas
                this.selection = true;
            }
        }

    }
    initStyle(x, y, zoom) {

        this.canvas.selectionColor = 'rgba(255,0,0,0.1)';
        this.canvas.selectionBorderColor = 'rgba(255,0,0,0.7)';
        this.canvas.selectionLineWidth = 1;
        this.canvas.hoverCursor = 'pointer';
        this.canvas.zoomToPoint({ x: x, y: y }, zoom);

        fabric.Object.prototype.hasControls = false;
        fabric.Object.prototype.controls.mtr.visible = false;
        fabric.Object.prototype.controls.deleteControl = new fabric.Control({
            x: 0.5,
            y: -0.5,
            offsetY: -16,
            offsetX: 16,
            cursorStyle: 'pointer',
            mouseUpHandler: deleteObject,
            render: renderIcon,
            cornerSize: 24
        });
        fabric.Textbox.prototype.controls.deleteControl = fabric.Object.prototype.controls.deleteControl;


        var deleteIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";

        var img = document.createElement('img');
        img.src = deleteIcon;

        function deleteObject(eventData, transform) {
            let target = transform.target;
            let canvas = target.canvas;
            canvas.remove(target);
            canvas.requestRenderAll();
        }

        function renderIcon(ctx, left, top, styleOverride, fabricObject) {
            let size = this.cornerSize;
            ctx.save();
            ctx.translate(left, top);
            ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
            ctx.drawImage(img, -size / 2, -size / 2, size, size);
            ctx.restore();
        }

    }
    toggleDragMode(dragMode) {
        this.canvas.toggleDragMode(dragMode || !this.dragMode);
    }
    addRect(style, selectable = true, hasControls = false, isCanDelete = true) {
        style = Object.assign({
            // lockMovementX: true,
            // lockRotation: true,
            // lockScalingX: true,
            // lockScalingY: true,
        }, style || {});
        delete style.type;
        let rect = new fabric.Rect(style);
        this.canvas.add(rect);
        rect.hoverCursor = 'default';
        rect.hasControls = hasControls;
        rect.selectable = selectable;
        rect.controls.deleteControl.visible = isCanDelete;
        return rect
    }
    addText(text, style, selectable = true, hasControls = true) {
        style = Object.assign({
            splitByGrapheme: true,
            // lockScalingX:true,
            // lockScalingY: true,
        }, style || {});
        delete style.type;
        let t = new fabric.Textbox(text, style);
        this.canvas.add(t);
        t.selectable = selectable;
        t.hasControls = hasControls;
        // t.charSpacing = 4;
        // t.centeredScaling=true;
        // console.log(t.controls)
        // t.hasRotatingPoint=false;
        return t
    }
    addImg(imageElement, style, selectable = true, hasControls = false) {
        style = Object.assign({
            // lockMovementX: true,
            // lockRotation: true,
            // lockScalingX: true,
            // lockScalingY: true,
        },
            style || {}
        );
        delete style.type;
        let imgInstance = new fabric.Image(imageElement, style);
        this.canvas.add(imgInstance);
        imgInstance.selectable = selectable;
        imgInstance.hasControls = hasControls;
        return imgInstance
    }
    addVideo(videoEl, style, selectable = true, hasControls = false) {
        style = Object.assign({
            // lockMovementX: true,
            // lockRotation: true,
            // lockScalingX: true,
            // lockScalingY: true,
        }, style || {});
        delete style.type;
        // console.log(videoEl)
        let video = new fabric.Image(videoEl, style);
        this.canvas.add(video);
        video.selectable = selectable;
        video.hasControls = hasControls;
        // console.log(video)
        video.getElement().play();
        video.getElement().setAttribute('loop', 'loop');
        this.render();
        return video
    }
    addSprite(url, style) {
        return new Promise((resolve, reject) => {
            fabric.Sprite.fromURL(url, sprite => {
                sprite.originX = sprite.originY = 'center';
                sprite.transparentCorners = false;
                sprite.set({
                    left: 0,
                    top: 0,
                    //angle: fabric.util.getRandomInt(-30, 30)
                });
                this.canvas.add(sprite);
                setTimeout(() => {
                    sprite.set('dirty', true);
                    sprite.play();
                }, fabric.util.getRandomInt(1, 10) * 100);

                this.render(true);
                resolve(sprite);
            }, style);
        })

    }

    addAndResizeImage(imageElement, style, type = 0, selectable = true) {
        style = { ...style };
        let { left, top, width, height } = style;
        // type 类型
        // 宽度缩放对齐
        // 0 垂直居中
        // 1 顶对齐
        // 2 底对齐
        // 3 高度
        // 高度缩放对齐
        // 4 水平居中
        // 5 左对齐
        // 6 右对齐

        let nw = imageElement.naturalWidth,
            nh = imageElement.naturalHeight;

        let tw = width,
            th = height;

        // 宽度优先
        if (type < 4) {
            height = nh * width / nw;
        } else {
            // 高度优先
            width = nw * height / nh;
        }

        if (type === 0) {
            top += (th - height) / 2;
        } else if (type === 2) {
            top = top + th - height;
        } else if (type === 3) {
            // left
            left += (tw - width) / 2;
        } else if (type === 5) {
            // left
            left = left + tw - width;
        };

        style = Object.assign(style, {
            left,
            top,
            nw,
            nh
        });
        delete style.type;

        let img = new fabric.Image(imageElement, {
            left,
            top,
            width: nw,
            height: nh
        });

        img.scaleToHeight(height);
        img.scaleToWidth(width);
        this.canvas.add(img);
        this.render(false);

        return

    }
    blur(object, value = 0.1) {
        var filter = new fabric.Image.filters.Blur({
            blur: value
        });
        object.filters.push(filter);
        object.applyFilters();
        this.canvas.renderAll();
    }
    blackWhite(object) {
        var filter = new fabric.Image.filters.BlackWhite();
        object.filters.push(filter);
        object.applyFilters();
        this.canvas.renderAll();
    }
    gray(object) {
        var filter = new fabric.Image.filters.Grayscale();
        object.filters.push(filter);
        object.applyFilters();
        this.canvas.renderAll();
    }
    render(animate = false) {
        this.canvas.renderAll();
        fabric.util.requestAnimFrame(() => {
            // console.log(this)
            if (animate === true) this.render(animate);
        });
    }

    moveToTop(target) {
        if (target) {
            let objects = this.canvas.getObjects();
            target.moveTo(objects.length + 99);
            this.render(false);
        }
    }

    getElement() {
        return this.canvas.wrapperEl
    }

    getObjects() {
        return this.canvas.getObjects();
    }

    exportJSON() {
        this.canvas.includeDefaultValues = false;
        return this.canvas.toJSON();
    }

    // zoom 会影响截图 
    toDataURL(bound = { left: 0, top: 0 },multiplier = 2, format = 'png') {
        let res = this.canvas.toDataURL({
            format: format,
            multiplier: multiplier,
            left: bound.left || 0,
            top: bound.top || 0,
            width: bound.width || this.canvas.width,
            height: bound.height || this.canvas.height
        });
        return res
    }

    exportImage(mainBoard,multiplier = 2, format = 'png') {
        this.zoomToFitCanvas();
        return this.toDataURL(mainBoard.getBoundingRect(),multiplier, format);
    }

    reset() {
        let objects = this.canvas.getObjects();
        objects.forEach(o => {
            this.canvas.remove(o);
        })
    }

    //让视图自动缩放以适应 Canvas（Canvas 固定大小）
    zoomToFitCanvas = () => {
        //遍历所有对对象，获取最小坐标，最大坐标
        var objects = this.canvas.getObjects();
        if (objects.length === 0) return;

        // 需要传参，详见api文档说明
        var rect = objects[0].getBoundingRect(true, true);
        var minX = rect.left;
        var minY = rect.top;
        var maxX = rect.left + rect.width;
        var maxY = rect.top + rect.height;
        for (var i = 1; i < objects.length; i++) {
            rect = objects[i].getBoundingRect(true, true);
            minX = Math.min(minX, rect.left);
            minY = Math.min(minY, rect.top);
            maxX = Math.max(maxX, rect.left + rect.width);
            maxY = Math.max(maxY, rect.top + rect.height);
        };

        //计算缩放比例
        var zoom = Math.min(
            this.canvas.width / (maxX - minX),
            this.canvas.height / (maxY - minY)
        );

        this.canvas.zoomToPoint({
            x: this.x,
            y: this.y
        }, zoom);

        let locks = [];
        objects.forEach(o => {
            let { lockMovementX, lockMovementY } = o;
            o.lockMovementX = false;
            o.lockMovementY = false;
            locks.push({ lockMovementX, lockMovementY });
        });
        let g = new fabric.Group(objects);
        this.canvas.viewportCenterObject(g);
        objects.forEach((o, i) => {
            o.lockMovementX = locks[i].lockMovementX;
            o.lockMovementY = locks[i].lockMovementY;
        });
        g.getObjects().forEach(o => g.removeWithUpdate(o));
        this.render();
    };

    // 动图
    promisedGif(gifURL) {
        return new Promise((resolve, reject) => {
            fetch(gifURL)
                .then(resp => resp.arrayBuffer())
                .then(buff => parseGIF(buff))
                .then(gif => decompressFrames(gif, true))
                .then(resolve);
        });
    }
    // 
    imageData2canvas(imageData) {
        let canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        canvas.getContext('2d').putImageData(imageData, 0, 0);
        return canvas
    }

    // 从gif转为sprite图
    // TODO 宽度不对
    // async buildSprite(gifUrl, c) {
    //     let canvas_sprite = c || new fabric.Canvas();
    //     let frames = await this.promisedGif(gifUrl);

    //     return new Promise((resolve, reject) => {
    //         frames.forEach((frame, i) => {
    //             // console.log(frame)
    //             let canvas_frame = this.imageData2canvas(
    //                 new ImageData(frame.patch, frame.dims.width,
    //                     frame.dims.height)
    //             );

    //             if (frames.length > 1) {
    //                 let img = new fabric.Image.fromURL(canvas_frame.toDataURL(), img => {
    //                     // console.log(img)
    //                     img.set('selectable', false);
    //                     img.left = img.getScaledWidth() * i;
    //                     // width = img.getWidth() * i + 1;

    //                     canvas_sprite.setHeight(img.getScaledHeight());
    //                     canvas_sprite.setWidth(img.getScaledWidth() * (i + 1));
    //                     canvas_sprite.add(img);
    //                     canvas_sprite.renderAll();
    //                     // 需要调试

    //                     if (i == frames.length - 1) {
    //                         let im = canvas_sprite.toDataURL('png');
    //                         resolve({
    //                                 img: im,
    //                                 width: canvas_frame.width,
    //                                 height: canvas_frame.height
    //                             })
    //                             // this.buildView(im, canvas_frame.width, canvas_frame.height)
    //                     }
    //                 });
    //             } else {
    //                 alert("Invalid GIF");
    //             }
    //         });
    //     });

    // }

    // buildView(img, width, height) {
    //     var canvas = new fabric.Canvas('merge');
    //     canvas.setBackgroundColor('lightgreen');
    //     canvas.setWidth(5000)
    //     canvas.setHeight(5000)

    //     fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
    //     fabric.Object.prototype.transparentCorners = false;

    //     var ratio = window.devicePixelRatio;
    //     var imgData = {
    //         spriteWidth: width * ratio,
    //         spriteHeight: height * ratio,
    //         spriteIndex: 0,
    //         frameTime: 150,
    //     }

    //     fabric.Sprite.fromURL(img, createSprite(), imgData);

    //     function createSprite() {
    //         return function(sprite) {
    //             sprite.set({
    //                 left: 500,
    //                 top: 250,
    //             });
    //             canvas.add(sprite);
    //             setTimeout(function() {
    //                 sprite.set('dirty', true);
    //                 sprite.play();
    //             }, fabric.util.getRandomInt(1, 10) * 100);
    //         };
    //     }

    //     (function render() {
    //         canvas.renderAll();
    //         fabric.util.requestAnimFrame(render);
    //     })();


    // }

}


module.exports = Canvas;