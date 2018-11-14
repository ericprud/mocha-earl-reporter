/**
 * MochaEarlReporter doc reference https://github.com/ericprud/mocha-earl-reporter#readme
 *
 * Module dependencies.
 */
'use strict';
const util = require('util');

const Top = `[ a earl:Assertion;
  earl:assertedBy <%s>;
  earl:subject <%s>;
  earl:test <%s%s>;
  earl:result [
    a earl:TestResult;
    earl:outcome earl:%s;
`;
const Extra = `    earl:message """%s""";
    earl:details """%s""";
`;
const Bottom = `    dc:date "%s"^^xsd:dateTime];
  earl:mode earl:automatic ] .

`;

const processPID = process.pid.toString();
const SUITE_START = `# start suite '%s'.\n\n`;
const SUITE_END = `# end suite '%s', duration: %sms.\n\n`;
const TEST_PASS = Top + Bottom; // asserter, subject, testPrefix, test, "passed", now()
const TEST_FAIL = Top + Extra + Bottom; // asserter, subject, testPrefix, test, "failed", message, details, now()
const TEST_PENDING = Top + Bottom; // asserter, subject, testPrefix, test, "skipped", now()
let Base, log, logError;

Base = require('mocha').reporters.Base;
log = function (msg) {
	process.stdout.write(msg);
};
logError = function (msg) {
	process.stderr.write(msg);
};

/**
 * Escape the given `str`.
 */

function escape(str) {
	if (!str) return '';
	return str
		.toString()
		.replace(/\x1B.*?m/g, '') // eslint-disable-line no-control-regex
		.replace(/\|/g, '||')
		.replace(/\n/g, '|n')
		.replace(/\r/g, '|r')
		.replace(/\[/g, '|[')
		.replace(/\]/g, '|]')
		.replace(/\u0085/g, '|x')
		.replace(/\u2028/g, '|l')
		.replace(/\u2029/g, '|p')
		.replace(/'/g, '|\'');
}

function formatString() {
	let formattedArguments = [];
	const args = Array.prototype.slice.call(arguments, 0);
	// Format all arguments for TC display (it escapes using the pipe char).
	let tcMessage = args.shift();
	args.forEach((param) => {
		formattedArguments.push(escape(param));
	});
	formattedArguments.unshift(tcMessage);
	return util.format.apply(util, formattedArguments);
}


/**
 * Initialize a new `MochaEarlReporter` reporter.
 *
 * @param {Runner} runner
 * @param {options} options
 * @api public
 */

function MochaEarlReporter(runner, options) {
	options = options || {};
	options.reporterOptions = options.reporterOptions || {};
	const asserter = options.reporterOptions.asserter || 'asserter';
	const subject = options.reporterOptions.subject || 'subject';
	const testPrefix = options.reporterOptions.testPrefix || 'testPrefix';
	const reporterOptions = options.reporterOptions || {};
	let flowId, useStdError, recordHookFailures;
	(reporterOptions.flowId) ? flowId = reporterOptions.flowId : flowId = process.env['MOCHA_EARL_FLOWID'] || processPID;
	(reporterOptions.useStdError) ? useStdError = reporterOptions.useStdError : useStdError = process.env['USE_STD_ERROR'];
	(reporterOptions.recordHookFailures) ? recordHookFailures = reporterOptions.recordHookFailures : recordHookFailures = process.env['RECORD_HOOK_FAILURES'];
	(useStdError) ? useStdError = (useStdError.toLowerCase() === 'true') : useStdError = false;
	(recordHookFailures) ? recordHookFailures = (recordHookFailures.toLowerCase() === 'true') : recordHookFailures = false;
	Base.call(this, runner);
	let stats = this.stats;
	const topLevelSuite = reporterOptions.topLevelSuite || process.env['MOCHA_EARL_TOP_LEVEL_SUITE'];

	runner.on('suite', function (suite) {
		if (suite.root) {
			if (topLevelSuite) {
				log(formatString(SUITE_START, topLevelSuite, flowId));
			}
			return;
		}
		suite.startDate = new Date();
		log(formatString(SUITE_START, suite.title, flowId));
	});

	runner.on('pass', function (test, err) {
		if (useStdError) {
			logError(formatString(TEST_PASS, asserter, subject, testPrefix, test.title, 'passed', new Date().toISOString()));
		} else {
			log(formatString(TEST_PASS, asserter, subject, testPrefix, test.title, 'passed', new Date().toISOString()));
		}
	});

	runner.on('fail', function (test, err) {
		if (useStdError) {
			logError(formatString(TEST_PASS, asserter, subject, testPrefix, test.title, 'failed', err.message, err.stack, new Date().toISOString()));
		} else {
			log(formatString(TEST_FAIL, asserter, subject, testPrefix, test.title, 'failed', err.message, err.stack, new Date().toISOString()));
		}
	});

	runner.on('pending', function (test) {
		log(formatString(TEST_PENDING, asserter, subject, testPrefix, test.title, 'skipped', new Date().toISOString()));
	});

	runner.on('suite end', function (suite) {
		if (suite.root) return;
		log(formatString(SUITE_END, suite.title, new Date() - suite.startDate, flowId));
	});

	runner.on('end', function () {
		if (topLevelSuite) {
			log(formatString(SUITE_END, topLevelSuite, stats.duration, flowId));
		}
		log(formatString(SUITE_END, 'mocha.suite', stats.duration, flowId));
	});
}


/**
 * Expose `MochaEarlReporter`.
 */

exports = module.exports = MochaEarlReporter;
