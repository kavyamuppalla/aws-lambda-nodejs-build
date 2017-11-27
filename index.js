exports.handler = (event, context, callback) => {
	var AWS = require('aws-sdk');
	var clone = require('nodegit-clone');
	var fs = require('fs');
	var child_process = require('child_process');

	AWS.config.update({ region: 'us-east-1' });
	var s3 = new AWS.S3({params: {Bucket: 'serverless-pipeline-artifacts'}, region: 'us-east-1'});

	clone({url: 'https://github.com/kavyamuppalla/sample-node', localPath: '/tmp/sample-node'}).then(function(repo) {
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
	});
	callback(null, "SUCCESS");
};