const express = require('express');
const fs = require('fs');
const FS = fs.promises;
const https = require('https');
const axios = require('axios');
const app = express();
const path = require('path');

const bodyParser = require('body-parser');

const { exec } = require('child_process');
const ffmpeg = require('ffmpeg-static'); ///run/media/strelok/Files/GitHub/CoubSite/back/node_modules/ffmpeg-static/ffmpeg

app.use(express.static('./front'));
app.use(bodyParser.json());


const config = require('./config.json');
if(process.env.PORT) config.port = process.env.PORT;
if(process.env.QUEUE) config.useRequestQueue = process.env.QUEUE;
if(process.env.QUEUE_LENGTH) config.requestQueueLength = process.env.QUEUE_LENGTH;

// queue
const requestQueue = [];
const later = (delay, value= 1) =>
    new Promise(resolve => setTimeout(resolve, delay, value));


// sendFile will go here
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, './front/index.html'));
});
app.get("/api", async (req, res)=>{
    res.send({"message": "Нет, подожди.. Для API там точно был post запрос..."})
});
app.post("/api", async (req, res)=>{
    if(config.useRequestQueue) {
        if(requestQueue.length > config.requestQueueLength) return res.send({error:"queue is full"});
        requestQueue.push({req,res});
    } else await apiFunc(req, res);
});

app.listen(config.port);

async function apiFunc(req,res){
    const {body:{url,type}} = req;
    if(!url||!type) res.send({error: "Data not providet"});

    const id = url.match(/^https:\/\/coub.com\/(view\/|embed\/)(.{4,6})/mi)[2];

    const dat = await axios.get("https://coub.com/api/v2/coubs/"+id)
        .catch(err=>{return {error: "Request error", err};});

    if(dat.error) return res.send(dat);

    const curTime = Date.now();

    const videoURL = dat.data.file_versions.html5.video.high?.url ?? dat.data.file_versions.html5.video.med?.url;
    const audioURL = dat.data.file_versions.html5.audio.high?.url ?? dat.data.file_versions.html5.audio.med?.url;

    if(type === "audio") return res.redirect(audioURL);
    if(type === "video") return res.redirect(videoURL);

    await Promise.all([
        downloadFile(videoURL, curTime+"-v.mp4"),
        downloadFile(audioURL, curTime+"-a.mp3")
    ]);

    const stats = await createEndFile(type, curTime);

    if(stats) return res.sendFile(path.join(__dirname, curTime+".mp4"));
    else return res.send({error:"Any server Error"});
}

async function createEndFile(type, curTime) {
    if(type === "audVid") {
        const audioTime = await getDuration(curTime+"-a.mp3").catch(()=> null);
        const videoTime = await getDuration(curTime+"-v.mp4").catch(()=> null);

        if(!audioTime||!videoTime) return null;

        const innert1 = await new Promise((resolve, reject) => {
            const process = exec(`${ffmpeg} -stream_loop -1 -i ${curTime}-v.mp4 -c:v libx264 -t ${audioTime} ${curTime}-tmp.mp4`);
            process.on('close', (code) => {
                setTimeout(()=>FS.unlink(`${curTime}.mp4`).catch(()=> null), 30000);
                if(code!==0) reject(code);
                else resolve(true);
            });

            process.stderr.on('data', console.error);
        }).catch(console.log);

        const innert2 = await new Promise((resolve, reject) => {
            const process = exec(`${ffmpeg} -i ${curTime}-tmp.mp4 -i ${curTime}-a.mp3 -c:v copy -c:a copy ${curTime}.mp4`);
            process.on('close', (code) => {
                setTimeout(()=>FS.unlink(`${curTime}.mp4`).catch(()=> null), 30000);
                if(code!==0) reject(code);
                else resolve(true);
            });

            process.stderr.on('data', console.error);
        }).catch(console.log);

        return (innert1&&innert2);
    }
    else if(type === "vidAud") {
        return await new Promise((resolve, reject) => {
            const process = exec(`${ffmpeg} -i ${curTime}-v.mp4 -i ${curTime}-a.mp3 -c:v copy -c:a aac -shortest ${curTime}.mp4`);
            process.on('close', (code) => {
                setTimeout(() => FS.unlink(`${curTime}.mp4`).catch(() => null), 30000);
                if (code !== 0) reject(code);
                else resolve(true);
            });

            process.stderr.on('data', console.error);
        }).catch(() => null);
    }
    else { //fixed2video
        const videoTime = await getDuration(curTime+"-v.mp4").catch(()=> null);
        if(!videoTime) return null;

        return await new Promise((resolve, reject) => {
            const process = exec(`${ffmpeg} -stream_loop 1 -i ${curTime}-v.mp4 -i ${curTime}-a.mp3 -c:v copy -c:a aac -t ${videoTime * 2} ${curTime}.mp4`);
            process.on('close', (code) => {
                console.error('createEndFile 1, код завершения: ', code);
                setTimeout(() => FS.unlink(`${curTime}.mp4`).catch(() => null), 30000);
                if (code !== 0) reject(code);
                else resolve(true);
            });

            process.stderr.on('data', console.error);
        }).catch(() => null);
    }
}

function getDuration(fileName) {
    return new Promise((resolve, reject) => {
        const process = exec(`${ffmpeg} -i ${fileName} 2>&1 | grep Duration`);

        process.stdout.on('data', (data) => {
            const time = data.match(/\d\d:(\d\d):(\d\d.{0,4}),/).slice(1);
            resolve(+time[0]*60+(+time[1]));
        });

        process.stderr.on('data', dat=>{
            reject(dat);
        });

        process.on('close', (code) => {
            if(code!==0) reject(code);
        });
    });
}
function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filename);

        https.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                file.close();
                resolve(filename);
                setTimeout(()=>FS.unlink(filename).catch(()=> null), 30000)
            });
        }).on('error', function(err) {
            console.log(`Что-то пошло не так при скачивании файла ${filename} ${url}`);
            fs.unlink(filename, (err) => {
                if (err) console.log(`Что-то пошло не так при удалении файла ${filename}`);
            });
            reject(err);
        });
    });
}
(async ()=>{
    if(config.useRequestQueue) {
        while (true) {
            if(requestQueue.length !== 0) {
                await apiFunc(requestQueue[0].req, requestQueue[0].res).catch(console.error);
                requestQueue.shift();
            } else await later(2000);
        }
    }
})();
