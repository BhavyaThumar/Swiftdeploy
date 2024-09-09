const express = require('express')
const httpProxy = require('http-proxy')
const app = express()
const PORT = 8000

const BASE_PATH = `http://hosting-aws-app.s3-website.ap-south-1.amazonaws.com/__outputs/`

// Reverse Proxying Sending req to proxy which is transffering it to Bucket
const proxy = httpProxy.createProxy()  

app.use((req,res)=> {
    console.log(req.hostname);
    
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];
    const resovleTo = `${BASE_PATH}/${subdomain}`

    return proxy.web(req,res, {target: resovleTo , changeOrigin: true})
})
proxy.on('proxyReq', (proxyReq, req,res)=> {
    const path = req.url
    if(path === '/' ){
        proxyReq.path += 'index.html'
    }
    return proxyReq
})

app.listen(PORT,console.log(`Reverse Proxy Running ${PORT}`))