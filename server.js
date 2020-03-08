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
            download(req.url, res);
        } else {
            downloadDecrypt(req.url, res);
        }
    } else if ( /\/upload\/[^\/]+$/.test(req.url) ) {
        if (encryption === 'none') {
            upload(req, res);
        } else {
            uploadEncrypt(req.url, res);
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

/* ENCRYPTION */

function downloadDecrypt(url, res){
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
  

  function uploadEncrypt(req, res){
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
  

// Nodejs encryption with CTR
let algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

function encrypt(text, algorithm) {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { 
        iv: iv.toString('hex'), 
        encryptedData: encrypted.toString('hex') 
    };
}
   
function decrypt(text, algorithm) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
   