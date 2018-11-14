/**
 * Created by jamie on 12/08/2017.
 * Must be run from the root project dir
 */
'use strict';

const {execFile} = require('child_process');
const {assert} = require('chai');
const path = require('path');

const { logMochaOutput, getMochaPath } = require('../testHelpers');

const internalMochaPath = getMochaPath();
const ASSERTER = 'http://a.example/tester';
const SUBJECT = 'http://a.example/subject';
const TEST_PREFIX = 'http://a.example/test-';

describe('Check EARL Output is correct', function () {
	let earlStdout, earlStderr, earlOutputArray;

	before(function (done) {
		execFile(internalMochaPath, [path.join('test', 'test_data', 'simple.js'),
                                             '--reporter', 'mocha-earl-reporter',
                                             '--reporter-options', 'asserter='+ASSERTER+',subject='+SUBJECT+',testPrefix='+TEST_PREFIX], (err, stdout, stderr) => {
			earlStdout = stdout;
			earlStderr = stderr;
			earlOutputArray = stdout.split('.\n\n'); // console.log(earlOutputArray.map((line, rowNo) => rowNo + ' ' + line ).join("\n"));
			logMochaOutput(stdout, stderr);
			done();
		});
	});

	it('Output should exist', function () {
		assert.isOk(earlStdout);
		assert.isOk(earlOutputArray);
		assert.isOk(earlStderr.length === 0);
		assert.isOk(earlOutputArray.length >= 5);
	});

	it('Suite started is OK', function () {
		const rowToCheck = earlOutputArray[0];
		assert.isOk(/# start suite /.test(rowToCheck));
		assert.isOk(/'Top Describe'/.test(rowToCheck));
	});

	it('Passing Test Finished is OK', function () {
		testForm(earlOutputArray[1], "pass1", "passed");
	});

	it('Test Failed is Failing', function () {
		const rowToCheck = earlOutputArray[2];
		testForm(rowToCheck, "fail2", "failed");
		assert.isOk(/earl:message """.*?"""/.test(rowToCheck));
		assert.isOk(/earl:details """.*?"""/.test(rowToCheck));
	});

	it('Skip Test Finished is ignored', function () {
		testForm(earlOutputArray[3], "skip3", "skipped");
	});

	it('Suite Finished is OK', function () {
		const rowToCheck = earlOutputArray[4];
		assert.isOk(/# end suite /.test(rowToCheck));
		assert.isOk(/'Top Describe'/.test(rowToCheck));
		assert.isOk(/duration:/.test(rowToCheck));
		assert.isOk(/ms/.test(rowToCheck));
	});

	it('Suite Root Finished is OK', function () {
		const rowToCheck = earlOutputArray[5];
		assert.isOk(/# end suite /.test(rowToCheck));
		assert.isOk(/'mocha.suite'/.test(rowToCheck));
		assert.isOk(/duration:/.test(rowToCheck));
		assert.isOk(/ms/.test(rowToCheck));
	});

	function testForm (rowToCheck, testName, disposition) {
		assert.isOk(/\[ a earl:Assertion;/.test(rowToCheck));
		assert.isOk(new RegExp("earl:assertedBy <\\b("+ASSERTER+")\\b>").test(rowToCheck));
		assert.isOk(new RegExp("earl:subject <\\b("+SUBJECT+")\\b>").test(rowToCheck));
		assert.isOk(new RegExp("earl:test <\\b("+TEST_PREFIX+testName+")\\b>").test(rowToCheck));
		assert.isOk(/earl:result \[/.test(rowToCheck));
		assert.isOk(/a earl:TestResult;/.test(rowToCheck));
		assert.isOk(new RegExp("earl:outcome earl:\\b("+disposition+")\\b").test(rowToCheck));
		assert.isOk(/dc:date "[^"]+"\^\^xsd:dateTime/.test(rowToCheck));
		assert.isOk(/earl:mode earl:automatic/.test(rowToCheck));
	};

});
