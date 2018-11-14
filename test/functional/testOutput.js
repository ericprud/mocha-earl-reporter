/**
 * Created by jamie on 12/08/2017.
 * Must be run from the root project dir
 */
'use strict';

const {execFile} = require('child_process');
const {assert} = require('chai');
const path = require('path');

const { executeTest, testForm } = require('../testHelpers');

describe('Check EARL Output is correct', function () {
	let res;

	before(function (done) {
		res = executeTest(path.join('test', 'test_data', 'simple.js'), done);
	});

	it('Output should exist', function () {
		assert.isOk(res.stdout);
		assert.isOk(res.array);
		assert.isOk(res.stderr.length === 0);
		assert.isOk(res.array.length >= 5);
	});

	it('Suite started is OK', function () {
		assert.isOk(/# start suite /.test(res.array[0]));
		assert.isOk(/'SomeSuite'/.test(res.array[0]));
	});

	it('Passing Test Finished is OK', function () {
		testForm(res.array[1], "pass1", "passed");
	});

	it('Test Failed is Failing', function () {
		testForm(res.array[2], "fail2", "failed");
		assert.isOk(/earl:message """.*?"""/.test(res.array[2]));
		assert.isOk(/earl:details """.*?"""/.test(res.array[2]));
	});

	it('Skip Test Finished is ignored', function () {
		testForm(res.array[3], "skip3", "skipped");
	});

	it('Suite Finished is OK', function () {
		assert.isOk(/# end suite /.test(res.array[4]));
		assert.isOk(/'SomeSuite'/.test(res.array[4]));
		assert.isOk(/duration:/.test(res.array[4]));
		assert.isOk(/ms/.test(res.array[4]));
	});

	it('Suite Root Finished is OK', function () {
		assert.isOk(/# end suite /.test(res.array[5]));
		assert.isOk(/'mocha.suite'/.test(res.array[5]));
		assert.isOk(/duration:/.test(res.array[5]));
		assert.isOk(/ms/.test(res.array[5]));
	});

});
