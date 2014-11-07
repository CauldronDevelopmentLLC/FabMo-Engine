var assert = require("assert");
var async = require("async");
var curl = require('node-curl');
var expect = require('chai').expect;
var base = require('./test_base');
var request = require('request');
var fs = require('fs');

//require('../log').suppress();

describe('Job Queue API', function(){

	it('Submit a job', function(done){
		// Log level
		var formData = {
			file : fs.createReadStream(__dirname + '/data/square.nc')
		}
		// Do a post request to change the log level
		request.post({url: 'http://127.0.0.1:9876/job', 'formData' : formData}, function(err, res, body) {
			json = JSON.parse(body);
			done();
		});
	});

	it('Clear the job queue', function(done) {
		// Log level
		var formData = {
			file : fs.createReadStream(__dirname + '/data/square.nc')
		}
		// Do a post request to change the log level
		request.post({url: 'http://127.0.0.1:9876/job', 'formData' : formData}, function(err, res, body) {
			json = JSON.parse(body);
			done();

			// Do a post request to change the log level
			request.post({url: 'http://127.0.0.1:9876/job/queue/clear'}, function(err, res, body) {
				json = JSON.parse(body);
				done();
			});
		

		});


	});


})
