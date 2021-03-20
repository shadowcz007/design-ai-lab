const https = require('@small-tech/https')
const fs = require('fs');
const path = require('path');

const humanseg=require('@paddlejs-models/humanseg');
humanseg.load();
window.humanseg=humanseg;
// console.log(path.join(__dirname, './mobile.html'))

const internalIp = require('internal-ip');


const server = https.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if(req.url==='/'){
        const html = fs.readFileSync(path.join(__dirname, './mobile.html'), 'utf8');
        res.writeHead(200, { 'Content-type': 'text/html' });
        // res.write('<h1>Node.js</h1>');
        res.end(html);
    }else if(req.url==='/socket.io.js'){
        const js = fs.readFileSync(path.join(__dirname, '../node_modules/socket.io/client-dist/socket.io.min.js'), 'utf8');
        res.writeHead(200, { 'Content-type': 'application/javascript' });
        res.end(js);
    }
   
});

const url = `https://${internalIp.v4.sync()}`;

server.listen(443, () => {
    console.log(` 🎉 Server running at ${url}`)
});

const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('a user connected',socket.id);
  io.emit('chat message',{
      type:'text',
      data:'a user connected'
  });
  socket.on('chat message', (msg) => {
      if(msg.type==='image'){
        //   console.log(msg.size)
          let im=new Image();
          im.src=msg.data;
          
          im.onload=()=>{
            humanseg.getGrayValue(im).then(({data})=>{
                const canvas1 = document.createElement('canvas');
                humanseg.drawHumanSeg(canvas1, data);
                let base64=canvas1.toDataURL();
                io.emit('chat message', {
                    type:'video',
                    data:base64
                });
                base64=null;
                im=null;
              });

          }
          
      }else{
        io.emit('chat message', msg);
      }
        
  });

});


module.exports = {
    url
}