const http = require('http')
const url = require('url')
const fs = require('fs')
const path = require('path')
const baseDirectory = __dirname   // or whatever base directory you want

const hostname = '127.0.0.1';
const port = 80;

/**
 * https://nodejs.org/docs/latest-v7.x/api/synopsis.html
 * https://stackoverflow.com/questions/6084360/using-node-js-as-a-simple-web-server
 * 
 */
const server = http.createServer(function (request, response) {
    try {
        var requestUrl = url.parse(request.url)
        // Need to use path.normalize so people can't access directories underneath baseDirectory
        var fsPath = baseDirectory+path.normalize(requestUrl.pathname)
        var fileStream = fs.createReadStream(fsPath)
        fileStream.pipe(response)
        fileStream.on('open', function() {
             response.writeHead(200)
        })
        fileStream.on('error',function(e) {
             response.writeHead(404) // assume the file doesn't exist
             response.end()
        })
   } catch(e) {
        response.writeHead(500)
        response.end() // end the response so browsers don't hang
        console.log(e.stack)
   }
})

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
})