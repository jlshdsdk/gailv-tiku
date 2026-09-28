# 《概率论与数理统计习题精选精解》刷题版 — 部署与使用说明

本站为纯静态多页面网站（MPA），无需服务器后端，可直接部署到 GitHub Pages、Vercel、Netlify 或任意静态托管平台。

## 一、本地预览

网站通过 KaTeX 渲染数学公式，需通过 HTTP 服务访问（直接双击 HTML 文件大部分功能可用，但个别浏览器会限制本地字体加载）。

任选其一：

```bash
# Python（推荐，Windows/macOS 通用）
cd site
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

```bash
# Node.js
npx serve site
```

## 二、部署到 GitHub Pages（零基础步骤）

### 1. 注册/登录 GitHub
访问 https://github.com 注册并登录。

### 2. 创建新仓库
1. 点击右上角「+」→「New repository」
2. Repository name 填：`gailv-tiku`（可自定义）
3. 选择 **Public**（GitHub Pages 免费版要求公开仓库）
4. 点击「Create repository」

### 3. 上传文件（两种方式任选）

**方式 A：网页上传（最简单）**
1. 在新仓库页面点击「uploading an existing file」
2. 把 `site` 文件夹里的**全部内容**（index.html、assets、chapters 等）拖入上传区
3. 点击「Commit changes」，等待上传完成

**方式 B：命令行**
```bash
cd site
git init
git add .
git commit -m "init: 概率论刷题网站"
git branch -M main
git remote add origin https://github.com/<你的用户名>/gailv-tiku.git
git push -u origin main
```

### 4. 开启 GitHub Pages
1. 仓库页面 →「Settings」→ 左侧「Pages」
2. Source 选择「Deploy from a branch」
3. Branch 选择 `main`，目录选择 `/ (root)`，点击「Save」
4. 等待 1-3 分钟，页面顶部会显示发布地址：
   `https://<你的用户名>.github.io/gailv-tiku/`

### 5. 手机访问
直接用手机浏览器打开上述地址即可，全站响应式适配。

## 三、网站功能速览

| 功能 | 操作 |
|---|---|
| 章节导航 | 首页点击章名/小节 |
| 快速定位 | 章节页左侧栏点击题号 |
| 上/下题切换 | 右侧悬浮 ↑↓ 按钮，或键盘 ← → |
| 标记已做 | 题目右上角「○ 未做」→「✓ 已做」 |
| 收起/展开解析 | 题目右上角按钮 |
| 夜间模式 | 顶栏 🌙 按钮 |
| 进度保存 | 自动存入浏览器本地存储，刷新不丢失 |

> 注意：学习进度保存在「浏览器本地存储」中，跨设备不共享；更换浏览器或清除缓存会重置。

## 四、目录结构

```
site/
├── index.html            # 首页：全书总目录 + 进度
├── assets/
│   ├── style.css         # 全局样式（含夜间模式）
│   ├── script.js         # 交互逻辑
│   └── katex/            # KaTeX 本地化（公式渲染，含字体）
└── chapters/
    ├── chapter-01.html   # 第1章 随机事件及其概率
    ├── chapter-02.html   # 第2章 随机变量及其分布
    ├── chapter-03.html   # 第3章 多维随机变量及其分布
    ├── chapter-04.html   # 第4章 随机变量的数字特征
    ├── chapter-05.html   # 第5章 大数定律与中心极限定理
    ├── chapter-06.html   # 第6章 数理统计基本概念
    ├── chapter-07.html   # 第7章 参数估计
    └── chapter-08.html   # 第8章 假设检验
```
