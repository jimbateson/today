#!/usr/bin/env node

/**
 * Creates the release for a new version of OptimusTime by making sure all of the right files
 * are in the right place, creating a new draft release on GitHub, uploading all of the assets
 * and then notifying Slack of the new release
 *
 * @module release
 * @author Alex Hall
 * @category App
 */

'use strict';

// If this errors try running the following first:
// git config --local http.postBuffer 157286400

// var childProcess = require('child_process');
const logSymbols = require('log-symbols');
const fs = require('fs');
const path = require('path');
const request = require('request');
const util = require('util');
const AdmZip = require('adm-zip');
const { exec } = require('child_process');
const blnDebug = /--debug/.test(process.argv[2]);

const token = process.env.GITHUB_TOKEN;
const objPackage = require('./package.json');

// Paths
const strWinOut = path.join(__dirname, 'out', 'make', 'squirrel.windows', 'x64');
const strMacOut = path.join(__dirname, 'out', 'make');

// The release description as markdown
let strRelease = ``;

// Let's give this release a name
let strName = `Today v${objPackage.version}`;

if(blnDebug)
{

	getRelease().then(() => {

		console.log(strRelease);

	});
	return;

}

checkToken()
	.then(getRelease)
	.then(zipAssets)
	// Create private release
	.then(createRelease)
	.then(uploadAssets)
	.then(publishRelease)
	.catch(error => {

		console.log(logSymbols.error, (error.message || error) + '\n');
		process.exit(1);

	});

/**
 * Check for a GitHub repo-accessible token
 */
function checkToken()
{

	if(!token)
	{

		return Promise.reject('Token environment variable not set\nSet it to a token with repo scope created from https://github.com/settings/tokens/new');

	} else {

		return Promise.resolve(token);

	}

}

/**
 * Get release information from commits to the repo since
 * the last tag/release
 *
 * @see https://blogs.sap.com/2018/06/22/generating-release-notes-from-git-commit-messages-using-basic-shell-commands-gitgrep/
 * @return {Promise}
 */
function getRelease()
{

	return new Promise((resolve, reject) => {

		fs.readFile(path.join(__dirname, 'release.txt'), 'utf8', (err, strData) => {

			if(err)
			{

				reject(err);

			}
			strRelease = strData;
			resolve();

		});

	});

}

/**
 * Zip up the the passed asset to offer a smaller filesize
 *
 * @param {Object} asset The asset to zip up
 * @return {Promise}
 */
function zipAsset(asset)
{

	return new Promise((resolve, reject) => {

		const assetBase = path.basename(asset.path);
		const assetPath = path.join(strWinOut, asset.name);

		console.log(logSymbols.info, 'Zipping ' + assetBase + ' to ' + asset.name + ' (this may take a while)');

		if(!fs.existsSync(asset.path))
		{

			return reject(new Error(asset.path + ' does not exist'));

		}

		// Create a new Zip Archive
		const zip = new AdmZip();

		// add local file
		zip.addLocalFile(asset.path);
		// or write everything to disk
		zip.writeZip(assetPath);

		// Set asset path to the new zip file
		asset.path = assetPath;
		resolve(asset);

	});
}

/**
 * Zip all required assets
 * @return {Promise}
 */
function zipAssets()
{

	// This is the only one we actually want to zip up
	let arrAssets = [{
		name: objPackage.productName + '-' + objPackage.version + '-Windows.zip',
		path: path.join(strWinOut, objPackage.productName + '-' + objPackage.version + '-Setup.exe')
	}];

	console.log(logSymbols.info, 'Zipping setup file.');

	// Zip the asset above and then return an array with all of the other assets
	return Promise.all(arrAssets.map(zipAsset)).then(arrAssets => {

		// Let me know
		console.log(logSymbols.success, 'The ZIP file was created successfully.');

		return arrAssets.concat([
			{
				name: 'RELEASES',
				path: path.join(strWinOut, 'RELEASES')
			},
			{
				name: objPackage.productName + '-' + objPackage.version + '-Setup.exe',
				path: path.join(strWinOut, objPackage.productName + '-' + objPackage.version + '-Setup.exe')
			},
			{
				name: objPackage.productName + 'Setup.msi',
				path: path.join(strWinOut, objPackage.productName + 'Setup.msi')
			},
			/*{
				name: objPackage.productName + '-' + objPackage.version.replace('beta.', 'beta') + '-delta.nupkg',
				path: path.join(strWinOut,objPackage.productName + '-' + objPackage.version.replace('beta.', 'beta') + '-delta.nupkg')
			},*/
			{
				name: objPackage.productName + '-' + objPackage.version.replace('beta.', 'beta') + '-full.nupkg',
				path: path.join(strWinOut, objPackage.productName + '-' + objPackage.version.replace('beta.', 'beta') + '-full.nupkg')
			},
			{
				name: objPackage.productName + '-darwin-x64-' + objPackage.version + '.zip',
				path: path.join(strMacOut, 'zip', 'darwin', 'x64', objPackage.productName + '-darwin-x64-' + objPackage.version + '.zip')
			},
			{
				name: objPackage.productName + '-' + objPackage.version + '.dmg',
				path: path.join(strMacOut, objPackage.productName + '-' + objPackage.version + '.dmg')
			}
		]);
	});

}

/**
 * Create a new release on GitHub releases
 *
 * @param  {Array} assets The assets to add to the release
 * @return {Promise}
 */
function createRelease(assets)
{

	const options = {
		uri: 'https://api.github.com/repos/jimbateson/today/releases',
		headers: {
			Authorization: 'token ' + token,
			'User-Agent': 'node/' + process.versions.node
		},
		json: {
			tag_name: 'v' + objPackage.version,
			target_commitish: 'develop',
			name: objPackage.version,
			body: strRelease,
			draft: true,
			prerelease: true
		}
	};

	return new Promise((resolve, reject) => {

		console.log(logSymbols.info, 'Creating new draft release');

		request.post(options, (error, response, body) => {

			if (error) {
				return reject(Error('Request failed: ' + (error.message || error)));
			}

			if (response.statusCode !== 201) {
				return reject(Error('Non-201 response: ' + response.statusCode + '\n' + util.inspect(body)));
			}

			console.log(logSymbols.success, 'Draft release created successfully.');

			resolve({assets: assets, draft: body});

		});

	});

}

/**
 * Upload our assets to the created GitHub release
 *
 * @param {Object} release The release to upload to (from createRelease)
 * @param {Object} asset   The asset to upload
 * @return {Promise}
 */
function uploadAsset(release, asset)
{

	const options = {
		uri: release.upload_url.replace(/\{.*$/, '?name=' + asset.name),
		headers: {
			Authorization: 'token ' + token,
			'Content-Type': 'application/zip',
			'Content-Length': fs.statSync(asset.path).size,
			'User-Agent': 'node/' + process.versions.node
		}
	};

	return new Promise((resolve, reject) => {

		console.log('• Uploading ' + asset.name + ' as release asset');

		const assetRequest = request.post(options, (error, response, body) => {

			if (error) {
				return reject(Error('Uploading asset failed: ' + (error.message || error)));
			}

			if (response.statusCode >= 400) {
				return reject(Error('400+ response: ' + response.statusCode + '\n' + util.inspect(body)));
			}

			console.log(logSymbols.success, 'Uploaded ' + asset.name + ' successfully');
			resolve(release);

		});

		fs.createReadStream(asset.path).pipe(assetRequest);

	});

}

/**
 * Upload all assets for this release
 *
 * @param  {Object} release The release
 * @return {Promise}
 */
function uploadAssets(release)
{

	console.log(logSymbols.info, 'Uploading release assets.');
	console.group();
	return Promise.all(release.assets.map(asset => uploadAsset(release.draft, asset))).then(() => {

		// Let me know
		console.groupEnd();
		console.log(logSymbols.success, 'All assets uploaded successfully.\n');
		return release;

	});

}

/**
 * Update the drafted release and set it to publish
 *
 * @param  {Object} release The release
 * @return {Promise}
 */
function publishRelease(release)
{

	const options = {
		uri: release.draft.url,
		headers: {
		Authorization: 'token ' + token,
			'User-Agent': 'node/' + process.versions.node
		},
		json: {
			draft: false,
			prerelease: objPackage.version.indexOf('beta') !== -1
		}
	};

	return new Promise((resolve, reject) => {

		console.log(logSymbols.info, 'Publishing release');

		request.post(options, (error, response, body) => {

			if(error)
			{
				return reject(Error('Request failed: ' + (error.message || error)));
			}

			if (response.statusCode !== 200)
			{
				return reject(Error('Non-200 response: ' + response.statusCode + '\n' + util.inspect(body)));
			}

			console.log(logSymbols.success, 'Package version ' + objPackage.version + ' released successfully!\n');

			const arrAssets = [
				{
					name: 'RELEASES',
					path: path.join(strWinOut, 'RELEASES')
				},
				{
					name: objPackage.productName + '-' + objPackage.version + '-Setup.exe',
					path: path.join(strWinOut, objPackage.productName + '-' + objPackage.version + '-Setup.exe')
				},
				{
					name: objPackage.productName + 'Setup.msi',
					path: path.join(strWinOut, objPackage.productName + 'Setup.msi')
				},
				/*{
					name: objPackage.productName + '-' + objPackage.version.replace('beta.', 'beta') + '-delta.nupkg',
					path: path.join(strWinOut,objPackage.productName + '-' + objPackage.version.replace('beta.', 'beta') + '-delta.nupkg')
				},*/
				{
					name: objPackage.productName + '-' + objPackage.version.replace('beta.', 'beta') + '-full.nupkg',
					path: path.join(strWinOut, objPackage.productName + '-' + objPackage.version.replace('beta.', 'beta') + '-full.nupkg')
				},
				{
					name: objPackage.productName + '-darwin-x64-' + objPackage.version + '.zip',
					path: path.join(strMacOut, 'zip', 'darwin', 'x64', objPackage.productName + '-darwin-x64-' + objPackage.version + '.zip')
				},
				{
					name: objPackage.productName + '-' + objPackage.version + '.dmg',
					path: path.join(strMacOut, objPackage.productName + '-' + objPackage.version + '.dmg')
				}
			];

			resolve(arrAssets);

		});

	});

}

/**
 * Update package.json by bumping the version number
 *
 * @return {Promise}
 */
function updatePackage(strType)
{

	return new Promise((resolve, reject) => {

		console.log(logSymbols.info, 'Bumping package version.');
		exec(`npm version ${strType} -m "🔖 Release v%s"`, { cwd : path.join(__dirname) }, (err, stdout, stderr) => {

			if(err){ reject(err); }
			if(stderr){ reject(stderr); }
			console.log(logSymbols.success, 'Bumped package.json version to ' + stdout + '\n');
			console.log(logSymbols.success, 'New version released successfully!');
			resolve();

		});

	});

}
