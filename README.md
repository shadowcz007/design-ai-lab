![LOGO](https://shadowcz007.github.io/design-ai-lab/assets/icons/ios/AppIcon.appiconset/icon-20-ipad.png)
![DEMO](https://shadowcz007.github.io/design-ai-lab/assets/demo.jpg)

# design-ai-lab【实验ing】

智能设计实验工具 Artificial Intelligence for Graph Design
！！！暂未完成开发，快速迭代中～～

- 使用JavaScript易于上手
- 集成p5.js、tensorflow.js、opencv.js
- 提供示例代码
- 桌面软件，安装即用
- 可发布为本地的桌面应用
- 基础AI能力
- 工具箱

# examples

- Hello World

- 海报合成工具

- 视频合成工具

- 图像处理实验

- 海报布局提取


**Clone and run for a quick way to see Electron in action.**

基本的electron应用包括以下文件:

- `package.json` - 管理应用的入口，依赖包等.
- `main.js` - 应用的主进程 **main process**.
- `src/index.html` - 一个html网页，是应用的渲染进程 **renderer process**.

可查阅electron官方文档 [Quick Start Guide](https://electronjs.org/docs/tutorial/quick-start).



## 如何使用

通过git clone此仓库，然后通过npm来进行安装、开发:

```bash
# Clone this repository
git clone https://github.com/shadowcz007/design-ai-lab.git
# Go into the repository
cd design-ai-lab
# Install dependencies
yarn install
# Run the app
yarn start
```

## TODO
- 增加缓存管理等基础功能
- 图像搜索引擎
- 多模态
- [face mesh](https://github.com/shadowcz007/FaceMeshFaceGeometry)
- 增强剪切板功能 A new way to manage your clipboard history.
- 形态分类：三角形、方形、圆形、倒三角……
- PPT文件格式支持
- 匿名头像 Protect your identity with generative media ，Upload your photo and discover look-a-like generated photos.
- 匿名人流统计
- 拟人摄像头，灵感来自Eyecam
- 图像智能缩放 JS Image Carver
- 虚拟偶像
- ffmpeg需要调研下wasm版本


## 感谢以下开源项目

[@tensorflow/tfjs 3.0.0]()

[ml](https://github.com/mljs/ml)

[@fortawesome/fontawesome-free]()

[opencvjs-dist 4.4.0]()

[fabric]()

[@ffmpeg-installer/ffmpeg]()

[idb-kv-store](https://www.npmjs.com/package/idb-kv-store)

[unsplash](https://github.com/unsplash/unsplash-js)

...详见package.json

### 欢迎访问微信公众号 Mixlab无界社区



##### 
- 如何在fabricjs上显示gif ？
方法1：gif经过ffmpeg转为mp4，通过video标签进行显示

x 方法2：gifuct-js把gif解析为imagedata，通过

- 如何把视频抠图后，显示在fabricjs上？


- 移动端safari
WebSocket network error: The operation couldn’t be completed. (OSStatus error -9807.)
websock在iphone上建立连接失败，在mac和pc和安卓都是好的

解决：ip替换成域名，或者不用https 或者用认证过的

- peerjs server部署到mixlab.top官网上

- 系统文件类型注册
暂时没找到方案

- electron node-gyp 编译问题
暂时把一些需要再次编译的依赖包去掉了。

- 打包应用的方法
node v14.17.4
打包win应用需要安装
```
brew install --cask wine-stable
```
```
sudo npm install -g @electron-forge/cli --unsafe-perm=true --allow-root
```

- 如果安装不上，可以试试把yarn.lock删掉，再装