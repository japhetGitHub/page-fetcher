const { createWriteStream, open } = require('fs');
const request = require('request');
const readline = require('readline');


const args = process.argv.slice(2);

const writeResponseToFile = (writeStream, location, headers, data) => {
  try {
    writeStream.write(data); // writes data from HTTP response
    writeStream.on('finish', () => {
      console.log(`Downloaded and saved ${headers['content-length']} bytes to ${location}`);
    });
    writeStream.on('error', (error) => {
      console.error("Error Overwriting File:", error);
    });
  } finally {
    writeStream.end();
  }
};

request(args[0], (error, response, body) => {
  if (error) {
    console.error('URL is invalid');
  } else {
    open(args[1], 'wx', (err, fd) => {
      if (err) { // since 'wx' flag, open() throws error if file already exists
        if (err.code === 'EEXIST') { // file already exists
          const r1 = readline.createInterface({ // user input
            input: process.stdin,
            output: process.stdout
          });
          r1.question('File already exists. Overwrite it anyway (y/n)? ', (answer) => {
            if(answer.toLowerCase() === 'n' || answer.toLowerCase() === 'no') {
              r1.close();
            } else if(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
              writeResponseToFile(createWriteStream(args[1]), args[1], response.headers, body);
              r1.close();
            } else { // invalid input
              r1.close();
            }
          });
        } else if (err.code === 'EINVAL' || err.code === 'ENOENT') {
          console.error('ERROR - File Path is Invalid: ', err.code);
        }
      } else {
        writeResponseToFile(createWriteStream('', { 'fd': fd }), args[1], response.headers, body);
      }  
    });
  }
  
});