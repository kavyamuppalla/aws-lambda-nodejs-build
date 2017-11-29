require('lambda-git')({'targetDirectory': '/tmp/pipeline/git'});
const execSync = require('child_process').execSync;
const AWS = require('aws-sdk');
const fs = require('fs');
exports.GIT_DIR = '/tmp/pipeline/git';
exports.CLONE_DIR = '/tmp/pipeline/clone';
exports.GIT_TEMPLATE_DIR = '/tmp/pipeline/git/usr/share/git-core/templates';
exports.GIT_EXEC_DIR = '/tmp/pipeline/git/usr/libexec/git-core';

exports.handler = (event, context, callback) => {

	console.log("Executing Shell Commands");
	execSync(`
		mkdir -p ${exports.GIT_DIR}
		cp -r ${__dirname}/. ${exports.GIT_DIR}
		tar -C ${exports.GIT_DIR} -xvf ${__dirname}/node_modules/lambda-git/git-2.4.3.tar

		mkdir -p ${exports.CLONE_DIR}
		export GIT_TEMPLATE_DIR=${exports.GIT_TEMPLATE_DIR}
		export GIT_EXEC_PATH=${exports.GIT_EXEC_DIR}

		echo $GIT_TEMPLATE_DIR
		echo $GIT_EXEC_PATH
		export PATH=$PATH:$GIT_TEMPLATE_DIR:$GIT_EXEC_PATH
		echo $PATH

		git --version
		cd ${exports.CLONE_DIR}
		git clone https://github.com/kavyamuppalla/sample-node
		cd sample-node
		
		npm install
		zip -r sample-node.zip .
	`, { 'stdio': [0,1,2]});

	AWS.config.update({ region: 'us-east-1' });
	var s3 = new AWS.S3({params: {Bucket: 'serverless-pipeline-artifacts'}, region: 'us-east-1'});
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

	//Move Infrastructure Template to S3
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
	
	callback(null, "SUCCESS");
};