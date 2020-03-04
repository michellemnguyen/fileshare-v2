# fileshare-v2
Node.JS simple server to upload and download files

### Pre-requisites
**Nothing** No NPM Module dependency, as it is written using pure Node.JS API. Only nodejs should be installed.

### Start server with default port 3000, default no encryption, default no compression
```
node server.js
```

### Start server with specific port 4200, RSA encrpytion, compression
```
node server.js 4200 rsa compress
```


### Start server with specific port 4200, AES encrpyption, compression
```
node server.js 4200 aes compress
```

### Start server with specific port 4200, no encrpyption, compression
```
node server.js 4200 none compress
```


### Start server with specific port 4200, AES encrpytion, default no compression
```
node server.js 4200 aes
```

### Start server with specific port 4200, AES encrpytion, no compression
```
node server.js 4200 aes none
```



### Open in browser, show download/upload UI
```
e.g http://localhost:3000
```