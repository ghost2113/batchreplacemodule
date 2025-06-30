/**
 * BatchModuleReplacementPlugin
 * @description
 * 批量模块替换插件，用于在 Webpack 构建过程中根据 replacementMap 实现模块路径的自动替换和兜底查找。
 * 支持 JS/Vue/JSON 等多种扩展名，自动查找 trunk 目录下的同名文件进行替换，提升开发与维护效率。
 * @author tianjinying
 * @date 2025-06-30
 * @usage
 */
"use strict";

const { join, relative, normalize, extname } = require('path');
const { access } = require('fs').promises;

const cacheTrunkPath = new Map();
class BatchModuleReplacementPlugin {
    constructor(replacementMap) {
        this.replacementMap = replacementMap;
        this.filenames = ['', '/index'];
		this.extensions = ['', '.js', '.vue', '.json'];
    }

    apply(compiler) {
        console.log(`webpack extensions: ${JSON.stringify(this.extensions)}`);
        compiler.plugin("normal-module-factory", (nmf) => {
            nmf.plugin("before-resolve", async (result, callback) => {
                if (!result) return callback();

                const { context, request } = result;

                if (/project/.test(context) && /^\.\.?\//.test(request) && !/node_modules/.test(request)) {
					const projectFilePath = join(context, request);
					let trunkFile = "";
					let isCache = "";
					if (cacheTrunkPath.has(projectFilePath)) {
						trunkFile = cacheTrunkPath.get(projectFilePath);
						isCache = "[cache] ";
					} else {
						trunkFile = await this.findFileInTrunk(projectFilePath);
					}

                    if (trunkFile) {
                        console.log('\n', `\x1B[31m find relative file in trunk ${isCache} :\x1B[39m \x1B[35m${trunkFile}\x1B[39m`);
                        result.request = relative(context, trunkFile);
                    }
                }

                return callback(null, result);
            });

            nmf.plugin("after-resolve", (result, callback) => {
                if (!result) return callback();
                const projectFilePath = this.replacementMap.get(normalize(result.resource));  // 是否在 replacementMap 中
				if (projectFilePath) {
					console.log('\n', `\x1B[31m replace file :\x1B[39m \x1B[35m${normalize(result.resource)}\x1B[39m`);
					result.resource = projectFilePath;
				}

                return callback(null, result);
            });
        });
    }

    async findFileInTrunk(projectFilePath) {
		const { filenames, extensions } = this;
        const trunkFilePath = projectFilePath.replace(/project\\[^\\]*\\/, '').replace(/project\/[^\/]*\//, '');

		const existingExt = extname(projectFilePath);
		if (existingExt) { // 存在扩展名，直接检查
			try {
				await access(projectFilePath);
				return null
			} catch (error) {
				try {
					await access(trunkFilePath);
					cacheTrunkPath.set(projectFilePath, trunkFilePath);
					return trunkFilePath;
				} catch (error) {
					return null;
				}
			}
		} else { // 不存在扩展名，尝试不同路径解析
			for (let i = 0, len = extensions.length; i < len; i++) {
				const extension = extensions[i];
				for (let j = 0, len = filenames.length; j < len; j++) {
					const filename = filenames[j];
					const projectFile = `${projectFilePath}${filename}${extension}`;
					try {
						await access(projectFile);
						continue;
					} catch (error) {
						const trunkFile = `${trunkFilePath}${filename}${extension}`;
						try {
							// trunkFile 存在, projectFile 不存在, 使用trunkFile进行兜底
							await access(trunkFile);
							cacheTrunkPath.set(projectFilePath, trunkFile);
							return trunkFile;
						} catch (error) {
							continue;
						}
					}
				}
			}
		}
    }
}

module.exports = BatchModuleReplacementPlugin;
