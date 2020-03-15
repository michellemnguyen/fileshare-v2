const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const NodeRSA = require('node-rsa');
var zlib = require('zlib');

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
        if (encryption === 'none' && compression === 'none') {
            download(req, res);
        } else if (encryption === ('aes' || 'rsa') && compression === 'none') {
            downloadDecrypt(req, res);
        } else if (encryption === 'none' && compression === 'compress') {
            downloadCompress(req, res);
        } else {
          console.log('Combining methods not allowed!');
          sendInvalidRequest(res);
        }
    } else if ( /\/upload\/[^\/]+$/.test(req.url) ) {
        if (encryption === 'none' && compression === 'none') {
            upload(req, res);
        } else if (encryption === ('aes' || 'rsa') && compression === 'none') {
            uploadEncrypt(req, res);
        } else if (encryption === 'none' && compression === 'compress') {
            uploadCompress(req, res);
        } else {
          console.log('Combining methods not allowed!');
          sendInvalidRequest(res);
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


function download(req, res){
  let file = path.join(__dirname, req.url);
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
  if (encryption !== 'none' && compression !== 'none') {
    res.write('Combining encrpytion and compression not allowed!')
  } else {
    res.write('Invalid Request');
  }
  res.end(); 
}

/* SYMMETRIC ENCRYPTION/DECRYPTION */
// using: https://gist.github.com/chris-rock/335f92742b497256982a

// Choosing encryption scheme, setting key & IV
let algorithm = 'aes-256-cbc';
let password = 'd6F3Efeq';

function downloadDecrypt(req, res) {
  let file = path.join(__dirname, req.url);

  if (encryption === 'aes') {
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
  } else if (encryption === 'rsa') {
    
  }
}

function decrypt(buffer){
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = Buffer.concat([decipher.update(buffer) , decipher.final()]);
    return dec;
}  

function uploadEncrypt(req, res) {
  console.log('uploading encrypted file');
  if (encryption === 'aes') {
    let fileName = path.basename(req.url);
    let filePath = path.join(__dirname, 'files', fileName);
    
    // encrypt content
    var encrypt = crypto.createCipher(algorithm, password);
    // create output file in correct location
    var output = fs.createWriteStream(filePath);

    req.pipe(encrypt).pipe(output);
    req.on('end', () => {
      res.writeHead(200, {'Content-Type': 'text'});
      res.write('uploaded succesfully');
      res.end();
    })  
  } else if (encryption === 'rsa') {
    // let fileName = path.basename(req.url);
    // let filePath = path.join(__dirname, 'files', fileName);

  }
}

/* COMPRESSION/DECOMPRESSION */
// reference: https://nodejs.org/api/zlib.html#zlib_class_options

function downloadCompress(req, res) {
  let file = path.join(__dirname, req.url);
  fs.readFile(file, (err, content) => {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text'});
      res.write('File Not Found!');
      res.end();
    } else {      
      res.writeHead(200, {'Content-Type': 'application/octet-stream'});
      res.write(zlib.unzipSync(content));
      res.end(); 
    }
  })
}

function uploadCompress(req, res) {
  console.log('saving compressed uploaded file');

  let fileName = path.basename(req.url);
  let filePath = path.join(__dirname, 'files', fileName);

  // zip content
  var zip = zlib.createGzip();
  // create output file
  var output = fs.createWriteStream(filePath);

  req.pipe(zip).pipe(output);
  req.on('end', () => {
    res.writeHead(200, {'Content-Type': 'text'});
    res.write('uploaded succesfully');
    res.end();
  })

}
