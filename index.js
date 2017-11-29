require('lambda-git')({'targetDirectory': '/tmp/cicd/git'});
const execSync = require('child_process').execSync;
const AWS = require('aws-sdk');
const fs = require('fs');
var archiver = require('archiver');
AWS.config.update({ region: 'us-east-1' });
var s3 = new AWS.S3({params: {Bucket: 'serverless-pipeline-artifacts'}, region: 'us-east-1'});

exports.GIT_DIR = '/tmp/cicd/git';
exports.CLONE_DIR = '/tmp/cicd/clone';
exports.GIT_TEMPLATE_DIR = '/tmp/cicd/git/usr/share/git-core/templates';
exports.GIT_EXEC_DIR = '/tmp/cicd/git/usr/libexec/git-core';

exports.handler = (event, context, callback) => {

	console.log("Executing Shell Commands");
	execSync(`
		ls -lrt
		mkdir -p ${exports.GIT_DIR}
		cp -r ${__dirname}/. ${exports.GIT_DIR}
		tar -C ${exports.GIT_DIR} -xf ${__dirname}/node_modules/lambda-git/git-2.4.3.tar

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
		git checkout master
		ls -lrt
		
		npm install
	`, { 'stdio': [0,1,2]});

	//Zip the project

	var output = file_system.createWriteStream('/tmp/cicd/clone/sample-node/sample-node.zip');
	var archive = archiver('zip', {zlib: { level: 9 }});

	output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
   
		//Move Artifact to S3
		fs.readFile('/tmp/cicd/clone/sample-node/sample-node.zip', function(err, data) {
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
	});

	archive.on('error', function(err){
	    throw err;
	});

	archive.pipe(output);
	archive.directory('/tmp/cicd/clone/sample-node', './')
	archive.finalize();

	//Move Infrastructure Template to S3
	fs.readFile('/tmp/cicd/clone/sample-node/infrastructure/resource.json', function(err, data) {
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