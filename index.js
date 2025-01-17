const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const stream = require('stream');
const {promisify} = require('util');
const uniqueString = require('unique-string');
const tempDir = require('temp-dir');
const {isStream} = require('is-stream');

const pipeline = promisify(stream.pipeline); // TODO: Use `node:stream/promises` when targeting Node.js 16.

const getPath = (prefix = '') => path.join(tempDir, prefix + uniqueString());

const writeStream = async (filePath, data) => pipeline(data, fs.createWriteStream(filePath));

async function runTask(temporaryPath, callback) {
	try {
		return await callback(temporaryPath);
	} finally {
		await fsPromises.rm(temporaryPath, {recursive: true, force: true});
	}
}

function temporaryFile({name, extension} = {}) {
	if (name) {
		if (extension !== undefined && extension !== null) {
			throw new Error('The `name` and `extension` options are mutually exclusive');
		}

		return path.join(temporaryDirectory(), name);
	}

	return getPath() + (extension === undefined || extension === null ? '' : '.' + extension.replace(/^\./, ''));
}

const temporaryFileTask = async (callback, options) => runTask(temporaryFile(options), callback);

function temporaryDirectory({prefix = ''} = {}) {
	const directory = getPath(prefix);
	fs.mkdirSync(directory);
	return directory;
}

const temporaryDirectoryTask = async (callback, options) => runTask(temporaryDirectory(options), callback);

async function temporaryWrite(fileContent, options) {
	const filename = temporaryFile(options);
	const write = isStream(fileContent) ? writeStream : fsPromises.writeFile;
	await write(filename, fileContent);
	return filename;
}

const temporaryWriteTask = async (fileContent, callback, options) => runTask(await temporaryWrite(fileContent, options), callback);

function temporaryWriteSync(fileContent, options) {
	const filename = temporaryFile(options);
	fs.writeFileSync(filename, fileContent);
	return filename;
}

// export export {default as rootTemporaryDirectory} from 'temp-dir';

module.exports = {
	temporaryFile,
	temporaryFileTask,
	temporaryWrite,
	temporaryWriteSync,
	temporaryWriteTask,
	temporaryDirectory,
	temporaryDirectoryTask,
}
