# Git utility

A **Git utility CLI tool** with some missing sub commands

[![NPM Dependency](https://img.shields.io/librariesio/github/idea2app/Git-utility.svg)][2]
[![CI & CD](https://github.com/idea2app/Git-utility/actions/workflows/main.yml/badge.svg)][3]

[![NPM](https://nodei.co/npm/git-utility.png?downloads=true&downloadRank=true&stars=true)][4]

## Installation

```shell
npm i git-utility -g
```

## Usage

### Download files/folders from Git repositories

```shell
# Download entire repository
xgit download https://github.com/your-org/your-repo

# Download from specific branch
xgit download https://github.com/your-org/your-repo main

# Download specific folder
xgit download https://github.com/your-org/your-repo main your-folder
```

### Manage Git submodules

```shell
# List current submodules
xgit submodule remove

# Remove a specific submodule
xgit submodule remove path/to/submodule
```

## Commands

- `xgit download <GitURL> [branchName] [folderPath]` - Download files/folders from a Git repository
- `xgit submodule remove [path]` - Remove a Git submodule

[1]: https://git-scm.com/
[2]: https://libraries.io/npm/git-utility
[3]: https://github.com/idea2app/Git-utility/actions/workflows/main.yml
[4]: https://nodei.co/npm/git-utility/
