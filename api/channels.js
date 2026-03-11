/**
 * IPTV API Server - FULL VERSION
 * Anti-CORS + Proxy Streaming
 */

const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()

app.use(cors())
app.use(express.json())

/* ================================
   SOURCES IPTV
================================ */

const DEFAULT_M3U_SOURCES = [
  { id:'fr', name:'France 🇫🇷', url:'https://iptv-org.github.io/iptv/countries/fr.m3u'},
  { id:'us', name:'USA 🇺🇸', url:'https://iptv-org.github.io/iptv/countries/us.m3u'},
  { id:'de', name:'Germany 🇩🇪', url:'https://iptv-org.github.io/iptv/countries/de.m3u'},
  { id:'gb', name:'UK 🇬🇧', url:'https://iptv-org.github.io/iptv/countries/gb.m3u'},
  { id:'ma', name:'Maroc 🇲🇦', url:'https://iptv-org.github.io/iptv/countries/ma.m3u'},
  { id:'dz', name:'Algérie 🇩🇿', url:'https://iptv-org.github.io/iptv/countries/dz.m3u'},
  { id:'mg', name:'Madagascar 🇲🇬', url:'https://iptv-org.github.io/iptv/countries/mg.m3u'}
]

/* ================================
   UTIL
================================ */

function parseM3U(text){

  const lines = text.split(/\r?\n/)
  const channels = []

  let cur = null

  for(const raw of lines){

    const line = raw.trim()

    if(line.startsWith('#EXTINF')){

      cur = {
        id:channels.length,
        name:'',
        logo:'',
        group:'Divers',
        url:''
      }

      const name = line.match(/,(.+)$/)
      if(name) cur.name = name[1]

      const logo = line.match(/tvg-logo="([^"]*)"/i)
      if(logo) cur.logo = logo[1]

      const group = line.match(/group-title="([^"]*)"/i)
      if(group) cur.group = group[1]

    }

    else if(line && !line.startsWith('#') && cur){

      cur.url = "/api/stream?url=" + encodeURIComponent(line)

      channels.push(cur)
      cur = null

    }

  }

  return channels
}

async function fetchText(url){

  const resp = await axios.get(url,{
    timeout:25000,
    responseType:'text',
    headers:{
      'User-Agent':'Mozilla/5.0'
    }
  })

  return resp.data

}

/* ================================
   ROUTES
================================ */

app.get('/api/health',(req,res)=>{
  res.json({ok:true})
})

/* SOURCES */

app.get('/api/sources',(req,res)=>{
  res.json({
    ok:true,
    sources:DEFAULT_M3U_SOURCES
  })
})

/* CHANNELS PAR PAYS */

app.get('/api/channels/:id', async(req,res)=>{

  const src = DEFAULT_M3U_SOURCES.find(s=>s.id===req.params.id)

  if(!src)
    return res.status(404).json({ok:false})

  try{

    const text = await fetchText(src.url)
    const channels = parseM3U(text)

    res.json({
      ok:true,
      source:src.name,
      channels
    })

  }catch(err){

    res.status(500).json({
      ok:false,
      error:err.message
    })

  }

})

/* ================================
   M3U URL
================================ */

app.post('/api/m3u/url', async(req,res)=>{

  const {url,name} = req.body

  if(!url)
    return res.status(400).json({ok:false})

  try{

    const text = await fetchText(url)

    const channels = parseM3U(text)

    res.json({
      ok:true,
      source:name||url,
      channels
    })

  }catch(err){

    res.status(500).json({
      ok:false,
      error:err.message
    })

  }

})

/* ================================
   M3U FILE
================================ */

app.post('/api/m3u/content',(req,res)=>{

  const {content,name} = req.body

  if(!content)
    return res.status(400).json({ok:false})

  try{

    const channels = parseM3U(content)

    res.json({
      ok:true,
      source:name||'file',
      channels
    })

  }catch(err){

    res.status(500).json({
      ok:false,
      error:err.message
    })

  }

})

/* ================================
   XTREAM CODES
================================ */

app.post('/api/xtream', async(req,res)=>{

  let {host,username,password} = req.body

  if(!host||!username||!password)
    return res.status(400).json({ok:false})

  host = host.replace(/\/$/,'')

  const api = `${host}/player_api.php?username=${username}&password=${password}`

  try{

    const streams = await axios.get(api + '&action=get_live_streams')

    const channels = streams.data.slice(0,500).map((s,i)=>({

      id:i,
      name:s.name,
      logo:s.stream_icon||'',
      group:'Live',
      url:`/api/stream?url=${encodeURIComponent(host+'/live/'+username+'/'+password+'/'+s.stream_id+'.m3u8')}`

    }))

    res.json({
      ok:true,
      channels
    })

  }catch(err){

    res.status(500).json({
      ok:false,
      error:err.message
    })

  }

})

/* ================================
   STREAM PROXY
================================ */

app.get('/api/stream', async(req,res)=>{

  const url = req.query.url

  if(!url)
    return res.status(400).send("missing url")

  try{

    const response = await axios({
      method:'GET',
      url:url,
      responseType:'stream',
      timeout:20000,
      headers:{
        'User-Agent':'Mozilla/5.0',
        'Referer':url
      }
    })

    res.setHeader('Access-Control-Allow-Origin','*')

    response.data.pipe(res)

  }catch(err){

    res.status(500).send("stream error")

  }

})

module.exports = app
