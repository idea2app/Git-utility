#! /usr/bin/env node

import { Command, createCommand } from 'commander-jsx';
import { $, cd, fs, os, path } from 'zx';

async function downloadGitFolder(GitURL: string, branchName?: string, folderPath?: string) {
    const tempFolder = path.join(os.tmpdir(), new URL(GitURL).pathname),
        targetFolder = process.cwd();

    await fs.remove(tempFolder);
    await fs.mkdirp(tempFolder);
    cd(tempFolder);

    if (folderPath) {
        await $`git init`;
        await $`git remote add origin ${GitURL}`;
        await $`git config core.sparseCheckout true`;
        await $`echo ${folderPath} > .git/info/sparse-checkout`;
        await $`git pull origin ${branchName}`;
    } else {
        await $`git clone ${GitURL} .`;
    }
    await $`git checkout ${branchName}`;

    await fs.remove(path.join(tempFolder, '.git'));
    
    const sourceFolder = folderPath ? path.join(tempFolder, folderPath) : tempFolder;
    
    // Check if source is a file or directory
    const sourceStat = await fs.stat(sourceFolder);
    
    if (sourceStat.isFile()) {
        // If it's a file, copy it directly to target directory with same name
        const fileName = path.basename(sourceFolder);
        await fs.copy(sourceFolder, path.join(targetFolder, fileName), { overwrite: true });
    } else {
        // If it's a directory, copy contents to target directory
        await fs.copy(sourceFolder, targetFolder, { overwrite: true });
    }
}

async function removeSubmodule(submodulePath?: string) {
    const currentDir = process.cwd();
    
    // If no path provided, list current submodules
    if (!submodulePath) {
        try {
            const result = await $`git submodule status`;
            console.log('Current submodules:');
            console.log(result.stdout);
            console.log('\nUsage: xgit submodule remove <path>');
            return;
        } catch (error) {
            console.error('Error: This does not appear to be a git repository with submodules.');
            process.exit(1);
        }
    }

    try {
        // Check if we're in a git repository
        await $`git rev-parse --git-dir`;
        
        // Check if submodule exists
        try {
            await $`git submodule status ${submodulePath}`;
        } catch (error) {
            console.error(`Error: Submodule '${submodulePath}' not found.`);
            process.exit(1);
        }
        
        console.log(`Removing submodule: ${submodulePath}`);
        
        // Remove submodule entry from .gitmodules (if .gitmodules exists)
        try {
            await $`git config --file .gitmodules --remove-section submodule.${submodulePath}`;
        } catch (error) {
            console.warn(`Warning: Could not remove from .gitmodules (file may not exist or section not found)`);
        }
        
        // Remove submodule entry from .git/config
        try {
            await $`git config --remove-section submodule.${submodulePath}`;
        } catch (error) {
            console.warn(`Warning: Could not remove from .git/config (section may not exist)`);
        }
        
        // Remove from git index
        await $`git rm --cached ${submodulePath}`;
        
        // Remove the submodule directory if it exists
        const submoduleDir = path.join(currentDir, submodulePath);
        if (await fs.pathExists(submoduleDir)) {
            await fs.remove(submoduleDir);
            console.log(`Removed directory: ${submodulePath}`);
        }
        
        // Stage .gitmodules changes if file exists
        if (await fs.pathExists('.gitmodules')) {
            await $`git add .gitmodules`;
        }
        
        console.log(`Successfully removed submodule: ${submodulePath}`);
        console.log('Note: You may want to commit these changes with:');
        console.log(`  git commit -m "Remove submodule ${submodulePath}"`);
        
    } catch (error) {
        if (error.message.includes('not a git repository')) {
            console.error('Error: This does not appear to be a git repository.');
        } else {
            console.error(`Error removing submodule ${submodulePath}:`, error.message);
        }
        process.exit(1);
    }
}

Command.execute(
    <Command
        name="xgit"
        version="0.1.2"
        description="A Git utility CLI tool with file download and submodule management capabilities"
    >
        <Command
            name="download"
            parameters="<GitURL> [branchName] [folderPath]"
            description="Download files/folders from a Git repository"
            executor={(
                _,
                GitURL: string,
                branchName = 'master',
                folderPath?: string
            ) => downloadGitFolder(GitURL, branchName as string, folderPath)}
        />
        <Command
            name="submodule"
            description="Manage Git submodules"
        >
            <Command
                name="remove"
                parameters="[path]"
                description="Remove a Git submodule. If no path provided, lists current submodules."
                executor={(_, submodulePath?: string) => removeSubmodule(submodulePath)}
            />
        </Command>
    </Command>,
    process.argv.slice(2)
);
