const daysofWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTimeComponent(time){
    let formattedTime = time < 10 ? '0' : '';
    return formattedTime + time;
}
function displayDateTime(){
    let currentDate = new Date();
    let today = daysofWeek[currentDate.getDay()];
    let hours = currentDate.getHours();
    let mins = currentDate.getMinutes();
    let secs = currentDate.getSeconds();
    minutes = formatTimeComponent(mins);
    seconds = formatTimeComponent(secs);
    let formattedDateTime = `${today}, ${currentDate.toLocaleDateString()} - ${hours}:${minutes}:${seconds}`;
    document.getElementById('datetime').innerText = formattedDateTime;
}

function changeFontSize() {
    const fontSize = document.getElementById('fontsize').value;
    let mainContent = document.getElementById('mainContent');
    const backGroundCl = document.getElementById('backgr').value;

    mainContent.className = fontSize;
    mainContent.classList.add(backGroundCl);
    localStorage.setItem('backgroundColor',backGroundCl);
    localStorage.setItem('fontSize', fontSize);
}

function changeBackgroundColor() {
    const backGroundCl = document.getElementById('backgr').value;
    let mainContent = document.getElementById('mainContent');
    const fontSize = document.getElementById('fontsize').value;

    mainContent.className = backGroundCl;
    mainContent.classList.add(fontSize);
    localStorage.setItem('backgroundColor',backGroundCl);
    localStorage.setItem('fontSize', fontSize);
    
}

function applychanges(){
    const savedBgColor = localStorage.getItem('backgroundColor');
    const savedFontSize = localStorage.getItem('fontSize');
    let mainContent = document.getElementById('mainContent');
    let fontSize = document.getElementById('fontsize');
    let backGroundCl = document.getElementById('backgr');

    if(savedBgColor && savedFontSize){
        mainContent.className = savedBgColor;
        mainContent.classList.add(savedFontSize);
        fontSize.value = savedFontSize;
        backGroundCl.value = savedBgColor;
    }else if(savedBgColor){
        mainContent.className = savedBgColor;
        backGroundCl.value = savedBgColor;
    }else if(savedFontSize){
        mainContent.className = savedFontSize;
        fontSize.value = savedFontSize;
    }
}
function activePage(){
    const currentFullPath = window.location.pathname;
    const splitsPath = currentFullPath.split("/");
    const currentPath = "./" + splitsPath[splitsPath.length-1];
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') == currentPath) {
            link.classList.add('active');
        }else{
            link.classList.remove('active');
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {
    displayDateTime();
    setInterval(displayDateTime, 1000);
    applychanges();
    activePage();
});