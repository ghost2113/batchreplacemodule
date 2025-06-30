const { promises: { readdir, writeFile } } = require('fs');
const { join, resolve } = require('path');

async function buildFiles() {
    const PROJECT = process.env.PROJECT;
    if (!PROJECT)  return;
    try {
        async function collectFiles(dir, relativeDir = '') {
            const result = [];
            const dirEntries = await readdir(dir, { withFileTypes: true });
            for (const entry of dirEntries) {
                const entryAbsPath = resolve(dir, entry.name);
                const entryRelPath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
                if (entry.isDirectory()) {
                    const subFiles = await collectFiles(entryAbsPath, entryRelPath);
                    result.push(...subFiles);
                } else if (entry.isFile()) {
                    const trunkFilePath = resolve(trunkSrcDir, entryRelPath);
                    filesMap.set(trunkFilePath, entryAbsPath);
                }
            }
            return result;
        }
        const filesMap = new Map();
        const trunkSrcDir = resolve('src');
        const projectSrcDir = join('project', PROJECT, 'src');
        await collectFiles(projectSrcDir);
        await writeFile(resolve(projectSrcDir, '..', 'files.json'), JSON.stringify(Object.fromEntries(filesMap), null, 2));
        console.log(`[buildAlias] success`);
    } catch (error) {
        console.error(`[buildAlias] error:`, error);
        process.exit(1);
    }
}

module.exports = buildFiles;
