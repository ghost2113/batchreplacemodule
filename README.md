# batchReplaceModule

## 简介

`batchReplaceModule` 是一个用于批量模块路径替换的工具，包含一个 Node.js 脚本（`buildFiles.js`）和一个 Webpack 插件（`BatchModuleReplacementPlugin.js`）。它可以自动收集项目源码文件，并在 Webpack 构建过程中实现模块路径的自动替换和兜底查找，支持 JS/Vue/JSON 等多种扩展名，提升多项目/多分支开发与维护效率。

---

## 你的目录结构

```
main/
├── project/
│   └── [PROJECT_NAME]/
│       └── src/
│           └── ...（项目源码文件）
└── src/
│     └── ...（主干源码文件）
├── package.json
```

---

## 使用说明

### 1. 生成文件映射（buildFiles.js）

#### 环境变量

- `PROJECT`：指定当前项目名称（对应 `project/[PROJECT]/src` 目录）。

#### 配置 buildFiles.js
```
const { buildFiles } = require('batchReplaceModule');
buildFiles();
```

#### 用法

在命令行中执行：

```bash
set PROJECT=your_project_name
node buildFiles.js
```

执行后会在 `project/[PROJECT]/files.json` 生成所有源码文件的绝对路径列表。

---

### 2. Webpack 插件集成（BatchModuleReplacementPlugin.js）

#### 引入插件

```javascript
const { BatchModuleReplacementPlugin } = require('batchReplaceModule');
// 引入buildFiles.js生成的files.json数据转为Map
let replacementMap = new Map()
const PROJECT = process.env.PROJECT
if (PROJECT) {
	const projectPath = path.resolve(__dirname, '..', 'project', PROJECT)
	const files = require(path.join(projectPath, 'files.json'))
    replacementMap = new Map(Object.entries(files));
}
```

#### 配置 Webpack

```javascript
module.exports = {
  // ...其他配置
  plugins: [
    new BatchModuleReplacementPlugin(replacementMap)
  ]
};
```

#### 插件功能

- 自动查找 trunk（主干）目录下的同名文件进行替换。
- 支持 JS/Vue/JSON 等扩展名。
- 支持 replacementMap 映射的路径优先替换。
- 控制台输出替换和查找信息，便于调试。

---

## 典型场景

- 多项目/多分支共用主干代码，分支可覆盖主干部分模块，未覆盖部分自动兜底主干实现。
- 需要批量替换模块路径，提升开发效率。

---

## 注意事项

- Node.js 版本需支持 `fs.promises`。
- `buildFiles.js` 需在每次源码变更后重新执行，确保 `files.json` 最新。
- replacementMap 的生成和维护需结合实际业务需求。

---

## License

MIT