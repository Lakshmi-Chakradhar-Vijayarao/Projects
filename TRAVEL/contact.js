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

    const div = document.getElementById("mainContent");
    const inp = div.getElementsByTagName("input");
    const lab = div.getElementsByTagName("label");
    const leg = div.getElementsByTagName("legend");
    const p = div.getElementsByTagName("p");
    const h3 = div.getElementsByTagName("h3");
    const texttar = div.getElementsByTagName("textarea");

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
        for(let tex of texttar){
            tex.style.color = "white";
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
        for(let tex of texttar){
            tex.style.color = "black";
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
    const texttar = div.getElementsByTagName("textarea");

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
        for(let tex of texttar){
            tex.style.color = "white";
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
        for(let tex of texttar){
            tex.style.color = "black";
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
function objectToXML(obj, rootElement = 'root') {
    let xml = `<${rootElement}>`;
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'object') {
                xml += objectToXML(obj[key], key);
            } else {
                xml += `<${key}>${obj[key]}</${key}>`;
            }
        }
    }
    xml += `</${rootElement}>`;
    return xml;
}
function downloadXML(filename, xmlContent) {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
function displaycontact(){
    const fname = document.getElementById("fname").value;
    const lname = document.getElementById("lname").value;
    const phone = document.getElementById("phone").value;
    const gender = document.querySelector('input[name="gen"]:checked').value;
    const email = document.getElementById("email").value;
    const comment = document.getElementById("comment").value;

    const contactObject = {
        root: {
            fname: fname,
            lname: lname,
            phone: phone,
            gender: gender,
            email: email,
            comment: comment
        }
    }
    const xml = objectToXML(contactObject);
    downloadXML('contactOutput.xml', xml);
}

function validateContactForm(){

    let fname = document.getElementById("fname").value;
    let lname = document.getElementById("lname").value;
    let phone = document.getElementById("phone").value.trim();
    let email = document.getElementById("email").value;

    document.getElementById("ferror").innerHTML = "";
    document.getElementById("lerror").innerHTML = "";
    document.getElementById("pherror").innerHTML = "";
    document.getElementById("emerror").innerHTML = "";


    const regex = /^[A-Z][a-zA-Z]*$/;
    const phoneregex = /^\(\d{3}\)\d{3}-\d{4}$/
    const emailregex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let validForm = true;

    if(!regex.test(fname)){
        validForm = false;
        document.getElementById("ferror").innerHTML = "Name can only contain alphabets. First letter should be capital.";
    }
    if(!regex.test(lname)){
        validForm = false;
        document.getElementById("lerror").innerHTML = "Name can only contain alphabets. First letter should be capital.";
    }
    if(fname == lname){
        validForm = false;
        document.getElementById("ferror").innerHTML = "First name and last name cannot be same.";
        document.getElementById("lerror").innerHTML = "First name and last name cannot be same.";
    }
    if(!phoneregex.test(phone)){
        validForm = false;
        document.getElementById("pherror").innerHTML = "Phone number should of the format (ddd)ddd-dddd";
    }
    if(!emailregex.test(email)){
        validForm = false;
        document.getElementById("emerror").innerHTML = "Email must contain @ and . and one or more characters before and after that.";
    }
    if(validForm){
        displaycontact();
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
    
    document.getElementById('formscontact').addEventListener('submit', function(event) {
        event.preventDefault();
        validateContactForm();
    });
});
