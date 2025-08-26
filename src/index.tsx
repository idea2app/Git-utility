#! /usr/bin/env node

import { Command, createCommand } from 'commander-jsx';
import { $, cd, fs, os, path } from 'zx';

async function downloadGitFolder(
    GitURL: string,
    branchName?: string,
    folderOrFilePath?: string
) {
    const tempFolder = path.join(os.tmpdir(), new URL(GitURL).pathname),
        targetFolder = process.cwd();

    await fs.remove(tempFolder);
    await fs.mkdirp(tempFolder);
    cd(tempFolder);

    if (folderOrFilePath) {
        await $`git init`;
        await $`git remote add origin ${GitURL}`;
        await $`git config core.sparseCheckout true`;
        await $`echo ${folderOrFilePath} > .git/info/sparse-checkout`;
        await $`git pull origin ${branchName}`;
    } else {
        await $`git clone ${GitURL} .`;
    }
    await $`git checkout ${branchName}`;

    await fs.remove(path.join(tempFolder, '.git'));

    const sourcePath = folderOrFilePath
        ? path.join(tempFolder, folderOrFilePath)
        : tempFolder;

    // Check if source is a file or directory
    const sourceStat = await fs.stat(sourcePath);

    if (sourceStat.isFile()) {
        // If it's a file, copy it directly to target directory with same name
        const fileName = path.basename(sourcePath);
        await fs.copy(sourcePath, path.join(targetFolder, fileName), {
            overwrite: true
        });
    } else {
        // If it's a directory, copy contents to target directory
        await fs.copy(sourcePath, targetFolder, { overwrite: true });
    }
}

async function listSubmodules() {
    const result = await $`git submodule status`;
    console.log(`Current submodules:
${result.stdout}
Usage: xgit submodule remove <path>`);
}

async function removeSubmodule(submodulePath: string) {
    console.log(`Removing submodule: ${submodulePath}`);

    // Remove submodule entry from .gitmodules
    await $`git config --file .gitmodules --remove-section submodule.${submodulePath}`;

    // Remove submodule entry from .git/config
    await $`git config --remove-section submodule.${submodulePath}`;

    // Remove from git index
    await $`git rm --cached ${submodulePath}`;

    // Remove the submodule directory
    await fs.remove(submodulePath);

    // Stage .gitmodules changes
    await $`git add .gitmodules`;

    console.log(`Successfully removed submodule: ${submodulePath}
Note: You may want to commit these changes with:
  git commit -m "Remove submodule ${submodulePath}"`);
}

Command.execute(
    <Command name="xgit">
        <Command
            name="download"
            parameters="<GitURL> [branchName] [folderOrFilePath]"
            description="Download files/folders from a Git repository"
            executor={(
                _,
                GitURL: string,
                branchName = 'main',
                folderOrFilePath?: string
            ) => downloadGitFolder(GitURL, branchName as string, folderOrFilePath)}
        />
        <Command name="submodule" description="Manage Git submodules">
            <Command
                name="remove"
                parameters="[path]"
                description="Remove a Git submodule. If no path provided, lists current submodules."
                executor={(_, submodulePath?: string) =>
                    submodulePath ? removeSubmodule(submodulePath) : listSubmodules()
                }
            />
        </Command>
    </Command>,
    process.argv.slice(2)
);
