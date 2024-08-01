const nav = document.querySelector(".nav");
const apiUrl = `${location.protocol}//${location.host}`;
const changeLangBtn = document.getElementById("chaneLang");
let lang = "RU";

window.addEventListener("scroll", fixNav);

changeLangBtn.onclick = ()=>{
    lang = changeLangBtn.innerHTML === "RU" ? "EN" : "RU";
    changeLangBtn.innerHTML = lang;

    chaneLanguage([lang === "RU" ? 0 : 1]);
};

const langLon = {
    vidAud: ["Видео + Аудио", "Video + Audio"],
    audVid: ["Аудио + Видео", "Audio + Video"],
    fix2vid: ["Fixed Видео*2 + Аудио", "Fixed Video*2 + Audio"],
    audio: ["Аудио", "Audio"],
    video: ["Видео", "Video"],
    info: ["Вставьте ссылку", "Insert link", "Не, ну она кривая...", "Wrong link...", "Yeeep! Эту ссылку можно скачать", "You can download it"],
    dropbtn: ["Скачать", "Download"],
    copied: ["Скопировано!", "Copied"],
};

function chaneLanguage(lang) {
    for(const it in langLon){
        document.getElementById(it).innerHTML = langLon[it][lang];
    }
}

function fixNav() {
    if (window.scrollY > nav.offsetHeight + 150) nav.classList.add("active");
    else nav.classList.remove("active");
}

function menuOpenFunc() {
    document.getElementById("myDropdown").classList.toggle("show");
}

function download(url,id) {
    const a = document.createElement('a');
    a.href = url;
    a.download = "JC_Coub."+(id === "audio" ? "mp3" : "mp4");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function copy(){
    window.navigator.clipboard.writeText(input.value).then(() => {
        setTimeout(()=>document.getElementById("copied").style.display = "none",1000);
    });
}

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
};

const info = document.getElementById("info");
const input = document.getElementById("input");
const downloadBtn = document.getElementById("dropbtn");

input.addEventListener("input", ()=>{
    if(/^https:\/\/coub.com\/(view\/|embed\/)/g.test(input.value)){
        info.innerText = langLon.info[lang==="RU" ? 4 : 5];
        downloadBtn.disabled = false;
    }
    else {
        info.innerText = langLon.info[lang==="RU" ? 2 : 3];
        downloadBtn.disabled = true;
    }
});

async function downloadButton(id){
    info.innerText = "Обработка";
    downloadBtn.disabled = true;

    const rawResponse = await fetch(apiUrl+'/api', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({url:input.value, type:id})
    });

    const contentType = rawResponse.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const json = await rawResponse.json();
        downloadBtn.disabled = true;
        info.innerText = json.error === "queue is full"? "Слишком много запросов. Повторите попытку позже." : "Произошла ошибка...";
        setTimeout(()=>{
            downloadBtn.disabled = false;
            info.innerText = "Вставьте ссылку на видео";
        }, 1500);
    }
    else {
        const blob = await rawResponse.blob();
        const file = window.URL.createObjectURL(blob);
        download(file,id);
        downloadBtn.disabled = false;
        info.innerText = "Вставьте ссылку на видео";
    }
}
