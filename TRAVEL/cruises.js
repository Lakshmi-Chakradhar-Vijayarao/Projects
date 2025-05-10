const daysofWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const validDestinationCruise = ['alaska', 'bahamas', 'europe', 'mexico'];
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
function displayCruiseInfo(){
    let cruiseDiv = document.getElementById("displaycruisedetails");
    const crDest = document.getElementById("dest").value;
    const minDepart = document.getElementById("departMin").value;
    const maxDepart = document.getElementById("departMax").value;
    const minDuration = document.getElementById("mindur").value;
    const maxDuration = document.getElementById("maxdur").value;
    const adultcheck = parseInt(document.getElementById("adNum").value);
    const childcheck = parseInt(document.getElementById("childNum").value);
    const infantcheck = parseInt(document.getElementById("infNum").value);
    let totalpass = 0;
    if(document.getElementById("adults").checked){
        totalpass += adultcheck
    }
    if(document.getElementById("children").checked){
        totalpass += childcheck
    }
    const totalrooms = Math.ceil(totalpass/2);

    cruiseDiv.innerHTML = `<p><b>Destination: </b> ${crDest}</p>`+
    `<p><b>Departing between: </b> ${minDepart} and ${maxDepart}</p>`+
    `<p><b>Minimum Cruise Duration: </b> ${minDuration}</p>` +
    `<p><b>Maximum Cruise Duration: </b> ${maxDuration}</p>` +
    `<p><b>Adult Passengers: </b> ${adultcheck}</p>` + `<p><b>Children Passengers: </b> ${childcheck}</p>`+
    `<p><b>Infant Passengers: </b> ${infantcheck}</p>`+ `<p><b>Number of Rooms: </b> ${totalrooms}</p>`;
}

function checkCruiseForm(){
    document.getElementById("displaycruisedetails").innerHTML = "";
    const crDest = document.getElementById("dest").value;
    const minDepart = document.getElementById("departMin").value;
    const maxDepart = document.getElementById("departMax").value;
    const minDuration = parseInt(document.getElementById("mindur").value);
    const maxDuration = parseInt(document.getElementById("maxdur").value);
    const adultcheck = parseInt(document.getElementById("adNum").value);
    const childcheck = parseInt(document.getElementById("childNum").value);
    const infantcheck = parseInt(document.getElementById("infNum").value);

    let crErr = document.getElementById("deserror");
    let departErr = document.getElementById("departerror");
    let minDurErr = document.getElementById("mindurerror");
    let maxDurErr = document.getElementById("maxdurerror");

    crErr.innerHTML = "";
    departErr.innerHTML = "";
    minDurErr.innerHTML = "";
    maxDurErr.innerHTML = "";

    let validForm = true;
    if(!validDestinationCruise.includes(crDest.toLowerCase())){
        validForm = false;
        crErr.innerHTML = "The destination should be Alaska, Bahamas, Europe, or Mexico.";
    }
    if(maxDepart < minDepart){
        validForm = false;
        departErr.innerHTML = "Second date should be after the first date."
    }
    if(minDuration > maxDuration){
        validForm = false;
        maxDurErr.innerHTML = "Maximum duration should be greater than minimum duration."
    }
    if(adultcheck > 0){
        document.getElementById("adults").checked = true;
    }else{
        document.getElementById("adults").checked = false;
    }
    if(childcheck > 0){
        document.getElementById("children").checked = true;
    }else{
        document.getElementById("children").checked = false;
    }
    if(infantcheck > 0){
        document.getElementById("infants").checked = true;
    }else{
        document.getElementById("infants").checked = false;
    }
    if(validForm){
        displayCruiseInfo();
    }
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

    const div = document.getElementById("mainContent");
    const inp = div.getElementsByTagName("input");
    const lab = div.getElementsByTagName("label");
    const leg = div.getElementsByTagName("legend");
    const p = div.getElementsByTagName("p");
    const h3 = div.getElementsByTagName("h3");
    const sel = div.getElementsByTagName("select");

    if(backGroundCl == "black"){
        for(let input of inp){
            input.style.color = "white";
        }
        for(let label of lab){
            label.style.color = "white";
        }
        for(let legend of leg){
            legend.style.color = "white";
        }
        for(let ps of p){
            ps.style.color = "white";
        }
        for(let h3s of h3){
            h3s.style.color = "white";
        }
        for(let selec of sel){
            selec.style.color = "white";
        }
    }else{
        for(let input of inp){
            input.style.color = "black";
        }
        for(let label of lab){
            label.style.color = "black";
        }
        for(let legend of leg){
            legend.style.color = "black";
        }
        for(let ps of p){
            ps.style.color = "black";
        }
        for(let h3s of h3){
            h3s.style.color = "black";
        }
        for(let selec of sel){
            selec.style.color = "black";
        }
    }
}
function updateInputchanges(){
    const savedBgColor = localStorage.getItem('backgroundColor');
    const backGroundCl = !!savedBgColor ? savedBgColor : document.getElementById('backgr').value;

    const div = document.getElementById("mainContent");
    const inp = div.getElementsByTagName("input");
    const lab = div.getElementsByTagName("label");
    const leg = div.getElementsByTagName("legend");
    const p = div.getElementsByTagName("p");
    const h3 = div.getElementsByTagName("h3");
    const sel = div.getElementsByTagName("select");

    if(backGroundCl == "black"){
        for(let input of inp){
            input.style.color = "white";
        }
        for(let label of lab){
            label.style.color = "white";
        }
        for(let legend of leg){
            legend.style.color = "white";
        }
        for(let ps of p){
            ps.style.color = "white";
        }
        for(let h3s of h3){
            h3s.style.color = "white";
        }
        for(let selec of sel){
            selec.style.color = "white";
        }
    }else{
        for(let input of inp){
            input.style.color = "black";
        }
        for(let label of lab){
            label.style.color = "black";
        }
        for(let legend of leg){
            legend.style.color = "black";
        }
        for(let ps of p){
            ps.style.color = "black";
        }
        for(let h3s of h3){
            h3s.style.color = "black";
        }
        for(let selec of sel){
            selec.style.color = "black";
        }
    }
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
    updateInputchanges();
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
    
    document.getElementById("formscruise").addEventListener("submit", function(event){
        event.preventDefault();
        checkCruiseForm();
    });
});
