const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require("zlib");
const decompress = zlib.createGunzip();

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
    } else if ( /\/download\/[^\/]+$/.test(req.url)) {
        sendUploadedFile(req.url, res);
    } else if ( /\/upload\/[^\/]+$/.test(req.url) ) {
        saveUploadedFile(req, res)
    } else {
        sendInvalidRequest(res);
    }
}

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


function sendUploadedFile(url, res){

  if(/.gz$/i.test(url)==true){
    newfileName = fileName.replace(".gz","");
    let file = path.join(__dirname, 'files', newfileName)
    url.pipe(zlib.createGunzip()).pipe(fs.createWriteStream(file));
  }
  let file = path.join(__dirname, url);


  
  fs.readFile(file, (err, content) => {
    if(err){
      res.writeHead(404, {'Content-Type': 'text'});
      res.write('File Not Found!');
      res.end();
    }else{
      res.writeHead(200, {'Content-Type': 'application/octet-stream'});
      res.write(content);
      res.end();
    }
  })
}


function saveUploadedFile(req, res){
  console.log('saving uploaded file');
  console.log('request was made:' + req.url);
  let fileName = path.basename(req.url);
  if (compression === 'compress'){
    newfileName = fileName + ".gz";
    let file = path.join(__dirname, 'files', newfileName)
    req.pipe(zlib.createGzip()).pipe(fs.createWriteStream(file));
  }
  else {
    let file = path.join(__dirname, 'files', fileName)
    req.pipe(fs.createWriteStream(file));
  }
  
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