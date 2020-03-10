const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');


let port = process.argv[2] || 3000;

// encryption scheme being used
// options: 'none', 'aes', 'rsa'
// default: 'none'
let encryption = process.argv[3] || 'none';

// compression vs no compression
// options: 'none', 'compress'
// default: 'none'
let compression = process.argv[4] || 'none';

const httpServer = http.createServer(requestHandler);
httpServer.listen(port, () => {
    console.log('server is listening on port', port)
    console.log('encryption scheme being used:', encryption)
    console.log('compression being used:', compression)
});

function requestHandler(req, res) {
    if (req.url === '/') {
        sendIndexHtml(res);
    } else if (req.url === '/list') {
        sendListOfUploadedFiles(res);
    } else if ( /\/files\/[^\/]+$/.test(req.url)) {
        if (encryption === 'none') {
            download(req, res);
        } else {
            downloadDecrypt(req, res);
        }
    } else if ( /\/upload\/[^\/]+$/.test(req.url) ) {
        if (encryption === 'none') {
            upload(req, res);
        } else {
            uploadEncrypt(req, res);
        }
    } else {
        sendInvalidRequest(res);
    }
}

/* FILE UPLOAD & DOWNLOAD */

function sendIndexHtml(res) {
    let indexFile = path.join(__dirname, 'index.html');
    fs.readFile(indexFile, (err, content) => {
        if(err) {
            res.writeHead(404, {'Content-Type': 'text'});
            res.write('File Not Found!');
            res.end();
        } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(content);
            res.end();
        }
    })
}

function sendListOfUploadedFiles(res){
    let uploadDir = path.join(__dirname, 'files');
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.log(err);
            res.writeHead(400, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(err.message));
            res.end();
        } else {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(files));
            res.end();
        }
  })
}


function download(url, res){
  let file = path.join(__dirname, url);
  fs.readFile(file, (err, content) => {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text'});
      res.write('File Not Found!');
      res.end();
    } else {
      res.writeHead(200, {'Content-Type': 'application/octet-stream'});
      res.write(content);
      res.end();
    }
  })
}


function upload(req, res){
  console.log('saving uploaded file');
  let fileName = path.basename(req.url);
  let file = path.join(__dirname, 'files', fileName)
  req.pipe(fs.createWriteStream(file));
  req.on('end', () => {
    res.writeHead(200, {'Content-Type': 'text'});
    res.write('uploaded succesfully');
    res.end();
  })
}

function sendInvalidRequest(res){
  res.writeHead(400, {'Content-Type': 'application/json'});
  res.write('Invalid Request');
  res.end(); 
}

/* ENCRYPTION/DECRYPTION */

// Nodejs encryption with CTR
let algorithm = 'aes-256-cbc';
let password = 'd6F3Efeq';

function downloadDecrypt(req, res) {
    let file = path.join(__dirname, req.url);
    fs.readFile(file, (err, content) => {
      if (err) {
        res.writeHead(404, {'Content-Type': 'text'});
        res.write('File Not Found!');
        res.end();
      } else {
        res.writeHead(200, {'Content-Type': 'application/octet-stream'});
        res.write(decrypt(content));
        res.end();
      }
    })
}

function decrypt(buffer){
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = Buffer.concat([decipher.update(buffer) , decipher.final()]);
    return dec;
}  

  function uploadEncrypt(req, res){
    console.log('saving encrypted uploaded file');

    let fileName = path.basename(req.url);
    let filePath = path.join(__dirname, 'files', fileName);

    // encrypt content
    var encrypt = crypto.createCipher(algorithm, password);
    // create output file
    var output = fs.createWriteStream(filePath);

    req.pipe(encrypt).pipe(output);
    req.on('end', () => {
      res.writeHead(200, {'Content-Type': 'text'});
      res.write('uploaded succesfully');
      res.end();
    })
  
}