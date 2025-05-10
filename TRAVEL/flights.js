const daysofWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const texasCaliCities = [
    'dallas',
    'houston',
    'austin',
    'san antonio',
    'el paso',
    'fort worth',
    'lubbock',
    'corpus christi',
    'midland',
    'amarillo',
    'brownsville',
    'mcAllen',
    'harlingen',
    'killeen',
    'waco',
    'tyler',
    'college station',
    'laredo',
    'beaumont',
    'abilene',
    'los angeles',
    'san francisco',
    'san diego',
    'san jose',
    'sacramento',
    'oakland',
    'long beach',
    'fresno',
    'santa barbara',
    'burbank',
    'palm springs',
    'ontario',
    'john wayne (santa sna)',
    'sedding',
    'monterey',
    'bakersfield',
    'stockton',
    'santa rosa',
    'eureka',
    'san luis obispo'
];

function formatTimeComponent(time){
    let formattedTime = time < 10 ? '0' : '';
    return formattedTime + time;
}
function displayDateTime(){
    let currentDate = new Date();
    let today = daysofWeek[currentDate.getDay()];
    let hrs = currentDate.getHours();
    let mins = currentDate.getMinutes();
    let secs = currentDate.getSeconds();
    let hours = formatTimeComponent(hrs);
    let minutes = formatTimeComponent(mins);
    let seconds = formatTimeComponent(secs);
    let formattedDateTime = `${today}, ${currentDate.toLocaleDateString()} - ${hours}:${minutes}:${seconds}`;
    document.getElementById('datetime').innerText = formattedDateTime;
}

function displayform(){
    let selectedVal = document?.querySelector('input[name="flightoptions"]:checked').value;
    if(selectedVal == "roundtrip"){
        document.getElementById("roundtripform").classList.remove("hidden");
    }else{
        document.getElementById("roundtripform").classList.add("hidden");
    }
    let userDiv = document.getElementById("FinalFlightDetails");
    userDiv.innerHTML = '';
}

let flightOptions = document.querySelectorAll('input[name="flightoptions"]');
flightOptions.forEach(function(val){
    val.addEventListener('change', displayform);
})

function openPassDetail(){
    document.getElementsByClassName("passengerList")[0].classList.remove("hidden");
}
function clickFlightstoCart(flightList, returnFlightList, adultcheck, childcheck, infantcheck){
    
    localStorage.setItem('flightVal', '');
    localStorage.setItem('returnFlightVal', '');
    
    const selectedFlightId = document?.querySelector('input[name="flightList"]:checked').value;
    for(let flight of flightList){
        if(flight.fId === selectedFlightId){
            const flightCart = {
                fId: flight.fId,
                origin: flight.origin,
                dest: flight.dest,
                departureDate: flight.departureDate,
                arrivalDate: flight.arrivalDate,
                departureTime: flight.departureTime,
                arrivalTime: flight.arrivalTime,
                adultPass: adultcheck,
                childPass: childcheck,
                infantPass: infantcheck,
                price: flight.price
            };
            localStorage.setItem('flightVal', JSON.stringify(flightCart));
            break;
        }
    }

    if(returnFlightList.length > 0){
        const selectedReturnFlightId = document?.querySelector('input[name="returnFlightList"]:checked').value;
        for(let flight of returnFlightList){
            if(flight.fId === selectedReturnFlightId){
                const returnFlightCart = {
                    fId: flight.fId,
                    origin: flight.origin,
                    dest: flight.dest,
                    departureDate: flight.departureDate,
                    arrivalDate: flight.arrivalDate,
                    departureTime: flight.departureTime,
                    arrivalTime: flight.arrivalTime,
                    adultPass: adultcheck,
                    childPass: childcheck,
                    infantPass: infantcheck,
                    price: flight.price
                };
                localStorage.setItem('returnFlightVal', JSON.stringify(returnFlightCart));    
                break;
            }
        }
    }

    const userDiv = document.getElementById("FinalFlightDetails");
    const confirm = document.createElement("p");
    confirm.innerHTML = "Flight Details are sent to Cart successfully";
    userDiv.appendChild(confirm);
}
function beforeAfterThreeDays(date1, date2){
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    const diffInMilli = Math.abs(d1 - d2);
    const threeDayMilli = 3*24*60*60*1000;

    return diffInMilli <= threeDayMilli ? true : false;
}
function fetchFlights(ori, dest, depDate, numPass){

    let xhr = new XMLHttpRequest();
    xhr.open("GET", "flightsList2.xml", false);
    xhr.send();
    const xmlString = xhr.responseText;

    const parser = new DOMParser();
    const flightDoc = parser.parseFromString(xmlString, 'application/xml');
    const flights = flightDoc.getElementsByTagName('Flight');

    let sameDayFlights = [];
    let diffDayFlights = [];
    for (let flight of flights) {
        const flightId = flight.getElementsByTagName('FlightID')[0].textContent;
        const origin = flight.getElementsByTagName('Origin')[0].textContent;
        const destination = flight.getElementsByTagName('Destination')[0].textContent;
        const departureDate = flight.getElementsByTagName('DepartureDate')[0].textContent;
        const arrivalDate = flight.getElementsByTagName('ArrivalDate')[0].textContent;
        const departureTime = flight.getElementsByTagName('DepartureTime')[0].textContent;
        const arrivalTime = flight.getElementsByTagName('ArrivalTime')[0].textContent;
        const availableSeats = flight.getElementsByTagName('AvailableSeats')[0].textContent;
        const price = flight.getElementsByTagName('Price')[0].textContent;
        
        if(origin.toLowerCase() === ori && destination.toLowerCase() === dest && availableSeats >= numPass){
            if(departureDate === depDate){
                sameDayFlights.push({
                    fId: flightId,
                    origin: origin,
                    dest: destination,
                    departureDate: departureDate,
                    arrivalDate: arrivalDate,
                    departureTime: departureTime,
                    arrivalTime: arrivalTime,
                    availableSeats: availableSeats,
                    price: price
                });
            }else if( beforeAfterThreeDays(depDate, departureDate)){
                diffDayFlights.push({
                    fId: flightId,
                    origin: origin,
                    dest: destination,
                    departureDate: departureDate,
                    arrivalDate: arrivalDate,
                    departureTime: departureTime,
                    arrivalTime: arrivalTime,
                    availableSeats: availableSeats,
                    price: price
                })
            }
        }
    }
    if(sameDayFlights.length > 0){
        return sameDayFlights;
    }else if(diffDayFlights.length > 0){
        return diffDayFlights;
    }else{
        return [];
    }
}

function displayUserInfo(){
    let userDiv = document.getElementById("FinalFlightDetails");
    const ori = document.getElementById('origin').value.trim().toLowerCase();
    const dest = document.getElementById('destination').value.trim().toLowerCase();
    const deDate = document.getElementById('depDate').value;
    const returnDeDate = document?.getElementById('depDate1')?.value;
    const adultcheck = parseInt(document.getElementById("adNum").value);
    const childcheck = parseInt(document.getElementById("childNum").value);
    const infantcheck = parseInt(document.getElementById("infNum").value);
    const selectedVal = document?.querySelector('input[name="flightoptions"]:checked').value;
    const totalPass = adultcheck + childcheck + infantcheck;
    
    const flightList = fetchFlights(ori, dest, deDate, totalPass);
    let div = document.createElement("div");
    div.classList.add("mainFlightList");

    if(flightList.length == 0){
        const noflight = document.createElement("h4");
        noflight.innerText = "No Flights available within 3 days of the selected date!";
        div.appendChild(noflight);
    }
    for(let flight of flightList){
        let divchild = document.createElement("div");
        divchild.classList.add("eachFlightOption");
        let input = document.createElement("input");
        input.type = "radio";
        input.id = `flight-${flight.fId}`;
        input.name = "flightList";
        input.value = flight.fId;

        let label = document.createElement("label");
        label.htmlFor = `flight-${flight.fId}`;

        label.innerHTML = `
        <p>Flight ID: ${flight.fId}</p>
        <p>Origin: ${flight.origin}</p>
        <p>Destination: ${flight.dest}</p>
        <p>Departure Date: ${flight.departureDate}</p>
        <p>Arrival Date: ${flight.arrivalDate}</p>
        <p>Departure Time: ${flight.departureTime}</p>
        <p>Arrival Time: ${flight.arrivalTime}</p>
        <p>Available Seats: ${flight.availableSeats}</p>
        `;

        divchild.appendChild(input);
        divchild.appendChild(label);
        div.appendChild(divchild);
    }
    userDiv.appendChild(div);
    if(selectedVal === "oneway"){
        document.getElementById('flightDetailsToCart').addEventListener('click', function(event) {
            event.preventDefault();
            clickFlightstoCart(flightList, [], adultcheck, childcheck, infantcheck);
        });
    }
    else if(selectedVal === "roundtrip"){
        const returnFlightList = fetchFlights(dest, ori, returnDeDate, totalPass);
        let returndiv = document.createElement("div");
        returndiv.classList.add("mainFlightList");

        const heading = document.createElement("h4");
        heading.innerText = "Select Returning Flights";
        userDiv.appendChild(heading);
        if(returnFlightList.length == 0){
            const noReturnflight = document.createElement("h4");
            noReturnflight.innerText = "No Return Flights available within 3 days of the selected date!";
            returndiv.appendChild(noReturnflight);
        }
        for(let flight of returnFlightList){

            let returndivchild = document.createElement("div");
            returndivchild.classList.add("eachFlightOption");
            let returninput = document.createElement("input");
            returninput.type = "radio";
            returninput.id = `returnFlight-${flight.fId}`;
            returninput.name = "returnFlightList";
            returninput.value = flight.fId;

            let returnlabel = document.createElement("label");
            returnlabel.htmlFor = `returnFlight-${flight.fId}`;

            returnlabel.innerHTML = `
            <p>Flight ID: ${flight.fId}</p>
            <p>Origin: ${flight.origin}</p>
            <p>Destination: ${flight.dest}</p>
            <p>Departure Date: ${flight.departureDate}</p>
            <p>Arrival Date: ${flight.arrivalDate}</p>
            <p>Departure Time: ${flight.departureTime}</p>
            <p>Arrival Time: ${flight.arrivalTime}</p>
            <p>Available Seats: ${flight.availableSeats}</p>
            `;

            returndivchild.appendChild(returninput);
            returndivchild.appendChild(returnlabel);
            returndiv.appendChild(returndivchild);
        }
        userDiv.appendChild(returndiv);

        document.getElementById('flightDetailsToCart').addEventListener('click', function(event) {
            event.preventDefault();
            clickFlightstoCart(flightList, returnFlightList, adultcheck, childcheck, infantcheck);
        });
    }
}

function checkForm(){
    document.getElementById("FinalFlightDetails").innerHTML="";
    let validForm = true;
    const org = document.getElementById('origin').value.trim().toLowerCase();
    const dest = document.getElementById('destination').value.trim().toLowerCase();
    const deDate = document.getElementById('depDate').value;
    const returnDeDate = document?.getElementById('depDate1')?.value;
    const adultcheck = document.getElementById("adNum").value;
    const childcheck = document.getElementById("childNum").value;
    const infantcheck = document.getElementById("infNum").value;
    const selectedVal = document?.querySelector('input[name="flightoptions"]:checked').value;
    
    let oerr = document.getElementById("orerror");
    let derr = document.getElementById("desterror");
    let deperr1 = document.getElementById("deperror1");

    oerr.innerHTML = "";
    derr.innerHTML = "";
    deperr1.innerHTML = "";

    if(!texasCaliCities.includes(org)){
        validForm = false;
        oerr.innerHTML = "Origin must be a city in Texas or California."
    }
    if(!texasCaliCities.includes(dest)){
        validForm = false;
        derr.innerHTML = "Destination must be a city in Texas or California."
    }
    if(org == dest){
        validForm = false;
        oerr.innerHTML = "Origin and Destination cannot be same.";
        derr.innerHTML = "Origin and Destination cannot be same.";
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
    if(selectedVal == "roundtrip"){
        if(!returnDeDate){
            validForm = false;
            deperr1.innerHTML = "This field is required";
        }
        else if(returnDeDate < deDate){
            validForm = false;
            deperr1.innerHTML = "Departure Date of the arriving flight should be after the Departure Date of departing flight."
        }
    }
    if(validForm){
        displayUserInfo();
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

    const div = document.getElementsByClassName("triptype")[0];
    const inp = div.getElementsByTagName("input");
    const lab = div.getElementsByTagName("label");
    const leg = div.getElementsByTagName("legend");
    const p = div.getElementsByTagName("p");
    const h3 = div.getElementsByTagName("h3");

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
    }
}
function updateInputchanges(){
    const savedBgColor = localStorage.getItem('backgroundColor');
    const backGroundCl = !!savedBgColor ? savedBgColor : document.getElementById('backgr').value;

    const div = document.getElementsByClassName("triptype")[0];
    const inp = div.getElementsByTagName("input");
    const lab = div.getElementsByTagName("label");
    const leg = div.getElementsByTagName("legend");
    const p = div.getElementsByTagName("p");
    const h3 = div.getElementsByTagName("h3");

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
    document.getElementById('formsflight').addEventListener('submit', function(event) {
        event.preventDefault();
        checkForm();
    });
});
