# fileshare-v2
Node.JS simple server to upload and download files

## Pre-requisites
Install node.js. In addition, navigate to the root to install package dependencies:
```
npm install
```

## Running the project

The format of the command to start the server is here:
```
node server.js [port #] [aes|none] [compress|none]
```

### Start server with port 3000, default no encryption, default no compression
```
node server.js 3000 none none
```

### Start server with port 3000, AES encrpyption, no compression
```
node server.js 3000 aes none
```

### Start server with port 3000, no encrpyption, compression
```
node server.js 3000 none compress
```


### Open in browser, show download/upload UI
```
e.g http://localhost:3000
```