'use strict';

const {assert} = require('chai');
const {execFile} = require('child_process');
const os = require('os');
const path = require('path');

const ASSERTER = 'http://a.example/tester';
const SUBJECT = 'http://a.example/subject';
const TEST_PREFIX = 'http://a.example/test-';

function logMochaOutput(stdout, stderr) {
	console.log('Observed Reporter Output');
	console.log('|#####################|');
	console.log(stdout);
	console.log('|#####################|');

	if (stderr) {
		console.log('|#####################|');
		console.log('stderr:');
		console.log('|#####################|');
		console.log(stderr);
		console.log('|#####################|');
	}
}


function getMochaPath() {
	if (os.platform() === 'win32') {
		return path.resolve('node_modules', '.bin', 'mocha.cmd');
	} else {
		return path.resolve('node_modules', '.bin', 'mocha');
	}
}

function getTestDataPath(){
	return path.join('test', 'test_data');
}

function executeTest (testPath, done) {
	let ret = {};
	execFile(getMochaPath(), [testPath,
                                     '--reporter', 'mocha-earl-reporter',
                                     '--reporter-options', 'asserter='+ASSERTER+',subject='+SUBJECT+',testPrefix='+TEST_PREFIX], (err, stdout, stderr) => {
		ret.stdout = stdout;
		ret.stderr = stderr;
		ret.array = stdout.split('.\n\n'); // console.log(earlOutputArray.map((line, rowNo) => rowNo + ' ' + line ).join("\n"));
		logMochaOutput(stdout, stderr);
		done();
	});
	return ret;
}

function testForm (rowToCheck, testName, disposition, asserter, subject, testPrefix) {
	assert.isOk(/\[ a earl:Assertion;/.test(rowToCheck));
	assert.isOk(new RegExp("earl:assertedBy <\\b("+(asserter || ASSERTER)+")\\b>").test(rowToCheck));
	assert.isOk(new RegExp("earl:subject <\\b("+(subject || SUBJECT)+")\\b>").test(rowToCheck));
	assert.isOk(new RegExp("earl:test <\\b("+(testPrefix || TEST_PREFIX)+testName+")\\b>").test(rowToCheck));
	assert.isOk(/earl:result \[/.test(rowToCheck));
	assert.isOk(/a earl:TestResult;/.test(rowToCheck));
	assert.isOk(new RegExp("earl:outcome earl:\\b("+disposition+")\\b").test(rowToCheck));
	assert.isOk(/dc:date "[^"]+"\^\^xsd:dateTime/.test(rowToCheck));
	assert.isOk(/earl:mode earl:automatic/.test(rowToCheck));
};

module.exports = {
	logMochaOutput,
	getMochaPath,
	getTestDataPath,
	executeTest,
	testForm,
	ASSERTER,
	SUBJECT,
	TEST_PREFIX
};
