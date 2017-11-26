var child_process = require('child_process');

child_process.exec('cd /projects/node-js-sample/ & npm install & tar cvf node-js-sample.tar .', function(error, stdout, stderr) {
	console.log(`stdout: ${stdout}`);
  	console.log(`stderr: ${stderr}`);

  	//Move Artifact to S3
});