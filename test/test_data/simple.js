/**
 * Created by jamie on 12/08/2017.
 */
'use strict';
const assert = require('assert');//for(;;);
	describe('Top Describe', function () {
		it('pass1', function () {
			assert.equal(1, 1);
		});
		it('fail2', function () {
			assert.equal(2, 1);
		});
		it.skip('skip3', function () {
			assert.equal(2, 1);
		});
});
