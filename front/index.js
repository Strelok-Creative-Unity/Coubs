const nav = document.querySelector(".nav");
window.addEventListener("scroll", fixNav);
const apiUrl = location.protocol+"//"+location.host;

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
    a.download = "JC_Coub."+(id==="audio"?"mp3":"mp4"); 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
function copy(){ 
    const area = document.createElement('textarea');
  
    document.body.appendChild(area);  
      area.value = "strelok@justcoders.ru";
      area.select();
      document.execCommand("copy");
    document.body.removeChild(area);  
    document.getElementById("copied").style.display = "inline-block";
    setTimeout(()=>document.getElementById("copied").style.display = "none",1000);

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

input.addEventListener("input", (e)=>{
    if(/^https:\/\/coub.com\/(view\/|embed\/)/g.test(input.value)){
        info.innerText = "Yeeep! Эту ссылку можно скачать"; 
        downloadBtn.disabled = false;
    }else {
        info.innerText = "Не, ну она кривая..."; 
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
    }else {
        const blob = await rawResponse.blob();
        const file = window.URL.createObjectURL(blob);
        download(file,id);
        downloadBtn.disabled = false;
        info.innerText = "Вставьте ссылку на видео";  
    }
    
}
