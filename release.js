#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');
const dotenv = require('dotenv');
dotenv.config();

const token = process.env.GITHUB_TOKEN;
const objPackage = require('./package.json');
const version = objPackage.version;
const github = new Octokit({
  userAgent: `node/${process.versions.node}`,
  log: {
    debug: () => {},
    info: () => {},
    warn: console.warn,
    error: console.error
  },
  request: {
    timeout: 30 * 1000,
  }
});

if (!token) {
  console.error('GITHUB_TOKEN environment variable not set\nSet it to a token with repo scope created from https://github.com/settings/tokens/new')
  process.exit(1)
};

github.authenticate = new Object({
  type: 'token',
  token: token
});

async function doRelease () {
  const release = await getOrCreateRelease();
  const assets = await prepareAssets();
  await uploadAssets(release, assets);
  await publishRelease(release);
  console.log('Done!');
};

doRelease().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});

function prepareAssets () {
  const outPath = path.join(__dirname, '..', 'out');

  const zipAssets = [{
    name: 'today-mac.zip',
    path: path.join(outPath, 'Today-darwin-x64', 'Today.app')
  }, {
    name: 'today-windows.zip',
    path: path.join(outPath, 'Today-win32-ia32')
  }, {
    name: 'today-linux.zip',
    path: path.join(outPath, 'Today-linux-x64')
  }]

  return Promise.all(zipAssets.map(zipAsset)).then((zipAssets) => {
    return zipAssets.concat([{
      name: 'RELEASES',
      path: path.join(outPath, 'windows-installer', 'RELEASES')
    }, {
      name: 'TodaySetup.exe',
      path: path.join(outPath, 'windows-installer', 'TodaySetup.exe')
    }, {
      name: `today-${version}-full.nupkg`,
      path: path.join(outPath, 'windows-installer', `today-${version}-full.nupkg`)
    }])
  })
}

function zipAsset (asset) {
  return new Promise((resolve, reject) => {
    const assetBase = path.basename(asset.path)
    const assetDirectory = path.dirname(asset.path)
    console.log(`Zipping ${assetBase} to ${asset.name}`)

    if (!fs.existsSync(asset.path)) {
      return reject(new Error(`${asset.path} does not exist`))
    }

    const zipCommand = `zip --recurse-paths --symlinks '${asset.name}' '${assetBase}'`
    const options = {cwd: assetDirectory, maxBuffer: Infinity}
    childProcess.exec(zipCommand, options, (error) => {
      if (error) {
        reject(error)
      } else {
        asset.path = path.join(assetDirectory, asset.name)
        resolve(asset)
      }
    })
  })
}

async function getOrCreateRelease () {
  const { data: releases } = await github.repos.listReleases({
    owner: 'jimbateson',
    repo: 'today',
    per_page: 100,
    page: 1
  })
  const existingRelease = releases.find(release => release.tag_name === `v${version}` && release.draft === true)
  if (existingRelease) {
    console.log(`Using existing draft release for v${version}`)
    return existingRelease
  }

  console.log('Creating new draft release')
  const { data: release } = await github.repos.createRelease({
    owner: 'jimbateson',
    repo: 'today',
    tag_name: `v${version}`,
    target_commitish: 'develop',
    name: version,
    body: 'An awesome new release :tada:',
    draft: true,
    prerelease: false
  })
  return release
}

async function uploadAssets (release, assets) {
  for (const asset of assets) {
    if (release.assets.some(ghAsset => ghAsset.name === asset.name)) {
      console.log(`Skipping already uploaded asset ${asset.name}`)
    } else {
      process.stdout.write(`Uploading ${asset.name}... `)
      try {
        await uploadAsset(release, asset)
      } catch (err) {
        if (err.name === 'HttpError' && err.message.startsWith('network timeout')) {
          console.error('\n')
          console.error(`  There was a network timeout while uploading ${asset.name}.`)
          console.error('  This likely resulted in a bad asset; please visit the release at')
          console.error(`  ${release.html_url} and manually remove the bad asset,`)
          console.error(`  then run this script again to continue where you left off.`)
          console.error('')
          process.exit(2)
        } else {
          throw err
        }
      }

      process.stdout.write('Success!\n')
      // [mkt] Waiting a bit between uploads seems to increase success rate
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}

function uploadAsset (release, asset) {
  return github.repos.uploadReleaseAsset({
    headers: {
      'content-type': 'application/octet-stream',
      'content-length': fs.statSync(asset.path).size
    },
    url: release.upload_url,
    file: fs.createReadStream(asset.path),
    name: asset.name
  })
}

function publishRelease (release) {
  console.log('Publishing release')
  return github.repos.updateRelease({
    owner: 'jimbateson',
    repo: 'today',
    release_id: release.id,
    draft: false
  })
}
