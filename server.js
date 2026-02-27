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
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify(req.body)});
    const d=await r.json();
    res.json(d);
  }catch(e){res.status(500).json({error:e.message});}
});
app.listen(process.env.PORT||3001,()=>console.log('Server ready'));
