exports.handler = (event, context, callback) => {
	var AWS = require('aws-sdk');
	var git = require('nodegit');
	var fs = require('fs');
	var child_process = require('child_process');

	AWS.config.update({ region: 'us-east-1' });
	var s3 = new AWS.S3({params: {Bucket: 'serverless-pipeline-artifacts'}, region: 'us-east-1'});
	var cloneOptions = {};
	cloneOptions.fetchOpts = {
		callbacks: {
			certificateCheck: function() { return 1; }
		}
	};

	console.log("Before GitHub");
	child_process.exec('rm -Rf /tmp/sample-node', function(error, stdout, stderr) {
		console.log(`stdout: ${stdout}`);
		console.log(`stderr: ${stderr}`);
		git.Clone('https://github.com/kavyamuppalla/sample-node', '/tmp/sample-node', cloneOptions).then(function(repo) {
			console.log("Path ==== " + repo.path());
			child_process.exec('cd /tmp/sample-node/ & npm install & zip -r sample-node.zip .', function(error, stdout, stderr) {
				console.log(`stdout: ${stdout}`);
		  	console.log(`stderr: ${stderr}`);

		  	//Move Artifact to S3
		  	fs.readFile('/tmp/sample-node/sample-node.zip', function(err, data) {
		  		console.log("Error ==== " + err);
		  		s3.putObject({
			  		Bucket: 'serverless-pipeline-artifacts',
			  		Key: 'artifacts/sample-node.zip',
			  		Body: data
			  	}, function(err, data) {
			  		console.log("Error ==== " + err);
			  		console.log("Data ==== " + data);
			  	});
		  	});

		  	fs.readFile('/tmp/sample-node/infrastructure/resource.json', function(err, data) {
		  		console.log("Error ==== " + err);
		  		s3.putObject({
			  		Bucket: 'serverless-pipeline-artifacts',
			  		Key: 'templates/sample-node/resource.json',
			  		Body: data
			  	}, function(err, data) {
			  		console.log("Error ==== " + err);
			  		console.log("Data ==== " + data);
			  	});
		  	});
			});
		}).catch(function(err) {
			console.error(err);
		});
	});
	
	callback(null, "SUCCESS");
};