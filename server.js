const express = require('express');
const app = express();
app.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin','*');
  res.header('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers','Content-Type,Authorization');
  if(req.method==='OPTIONS'){res.sendStatus(200);return;}
  next();
});
app.use(express.json({limit:'50mb'}));
app.post('/api/claude',async(req,res)=>{
  try{
    const https=require('https');
    const body=JSON.stringify(req.body);
    const options={hostname:'api.anthropic.com',path:'/v1/messages',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),'x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'}};
    const r=await new Promise((resolve,reject)=>{
      const req2=https.request(options,(res2)=>{
        let data='';
        res2.on('data',(chunk)=>{data+=chunk;});
        res2.on('end',()=>{resolve(JSON.parse(data));});
      });
      req2.on('error',reject);
      req2.write(body);
      req2.end();
    });
    res.json(r);
  }catch(e){console.error(e);res.status(500).json({error:e.message});}
});
app.listen(process.env.PORT||3001,()=>console.log('Server ready'));
