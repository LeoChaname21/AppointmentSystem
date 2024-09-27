const qrcode = require('qrcode-terminal');
const { Client,LocalAuth } = require('whatsapp-web.js')

const whatsapp = new Client({
    authStrategy: new LocalAuth()
})

whatsapp.on('qr',qr=> {
    qrcode.generate(qr,{
        small: true
    });
});

whatsapp.on('ready',()=>{
    console.log("Client is ready!")
});

module.exports = {whatsapp};