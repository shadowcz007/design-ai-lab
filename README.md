![LOGO](https://shadowcz007.github.io/design-ai-lab/assets/icons/ios/AppIcon.appiconset/icon-20-ipad.png)
![DEMO](https://shadowcz007.github.io/design-ai-lab/examples/demo.jpg)

# design-ai-lab

智能设计实验工具 Artificial Intelligence for Graph Design

- 使用JavaScript易于上手
- 集成p5.js、tensorflow.js、opencv.js
- 提供示例代码
- 桌面软件，安装即用
- 可发布为本地的桌面应用
- 基础AI能力

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
npm install
# Run the app
npm start
```

## TODO
- 图像搜索引擎
- 多模态
- [face mesh](https://github.com/shadowcz007/FaceMeshFaceGeometry)


## 感谢以下开源项目

[@tensorflow/tfjs 3.0.0]()

[@fortawesome/fontawesome-free]()

[opencvjs-dist 4.4.0]()

[fabric]()

[@ffmpeg-installer/ffmpeg]()

[idb-kv-store](https://www.npmjs.com/package/idb-kv-store)

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