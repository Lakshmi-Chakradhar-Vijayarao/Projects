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
    const h2 = div.getElementsByTagName("h2");
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
        for(let h2s of h2){
            h2s.style.color = "white";
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
        for(let h2s of h2){
            h2s.style.color = "black";
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
function serializeXML(xmlDOM) {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDOM);
}

// Function to download updated XML
function downloadXML(filename, xmlContent) {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
function updateFileDoc(totalPass, departFlightID, returnFlightID){
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "flightsList2.xml", false);
    xhr.send();
    const xmlString = xhr.responseText;

    const parser = new DOMParser();
    const flightDoc = parser.parseFromString(xmlString, 'application/xml');
    const flights = flightDoc.getElementsByTagName('Flight');

    for (let i = 0; i < flights.length; i++) {
        const flight = flights[i];
        const id = flight.getElementsByTagName('FlightID')[0].textContent;
        if (id === departFlightID) {
            const availableSeats = flight.getElementsByTagName('AvailableSeats')[0].textContent;
            flight.getElementsByTagName('AvailableSeats')[0].textContent = availableSeats - totalPass;
            break;
        }
        if(returnFlightID && id === returnFlightID){
            const returnavailableSeats = flight.getElementsByTagName('AvailableSeats')[0].textContent;
            flight.getElementsByTagName('AvailableSeats')[0].textContent = returnavailableSeats - totalPass;
            break;
        }
    }

    const updatedXML = serializeXML(flightDoc);
    downloadXML('flightsList2.xml', updatedXML);
}
function displayFullInfo(totalPass, departFlightID, returnFlightID){
    const finalDiv = document.getElementsByClassName("displayFullFlightInfo")[0];
    const h3div = document.createElement("h3");
    h3div.innerHTML = "Booking successful. Final Details are: ";
    finalDiv.appendChild(h3div);

    const flightInfoDiv = document.createElement("div");
    flightInfoDiv.classList.add("finalFlightBooking");

    const flightDetailsVal = localStorage.getItem('flightVal');
    if(flightDetailsVal){
        const flightDetails = JSON.parse(flightDetailsVal);
        const randomNum = Math.floor(Math.random() * 90)+10;
        const randomNum2 = Math.floor(Math.random() * 90)+10;
        const bookingId = flightDetails.fId.substr(0,2) + randomNum + flightDetails.fId.substr(2,2) + randomNum2 + flightDetails.fId.substr(4);
        const detailsDiv = document.createElement("div");
        detailsDiv.innerHTML = `
        <h2>Departing Flight Details: </h2>
        <p><b>Booking ID: </b>${bookingId}</p>
        <p><b>Flight ID: </b>${flightDetails.fId}</p>
        <p><b>Origin: </b>${flightDetails.origin}</p>
        <p><b>Destination: </b>${flightDetails.dest}</p>
        <p><b>Departure Date: </b>${flightDetails.departureDate}</p>
        <p><b>Arrival Date: </b>${flightDetails.arrivalDate}</p>
        <p><b>Departure Time: </b>${flightDetails.departureTime}</p>
        <p><b>Arrival Time: </b>${flightDetails.arrivalTime}</p>
        `;
        flightInfoDiv.appendChild(detailsDiv);
    }

    const returnflightDetailsVal = localStorage.getItem('returnFlightVal');
    if(returnflightDetailsVal){
        const returnflightDetails = JSON.parse(returnflightDetailsVal);
        const returnrandomNum = Math.floor(Math.random() * 90)+10;
        const returnrandomNum2 = Math.floor(Math.random() * 90)+10;
        const returnbookingId = returnflightDetails.fId.substr(0,2) + returnrandomNum + returnflightDetails.fId.substr(2,2) + returnrandomNum2 + returnflightDetails.fId.substr(4);
        const returndetailsDiv = document.createElement("div");
        returndetailsDiv.innerHTML = `
        <h2>Returning Flight Details: </h2>
        <p><b>Booking ID: </b>${returnbookingId}</p>
        <p><b>Flight ID: </b>${returnflightDetails.fId}</p>
        <p><b>Origin: </b>${returnflightDetails.origin}</p>
        <p><b>Destination: </b>${returnflightDetails.dest}</p>
        <p><b>Departure Date: </b>${returnflightDetails.departureDate}</p>
        <p><b>Arrival Date: </b>${returnflightDetails.arrivalDate}</p>
        <p><b>Departure Time: </b>${returnflightDetails.departureTime}</p>
        <p><b>Arrival Time: </b>${returnflightDetails.arrivalTime}</p>
        `;
        flightInfoDiv.appendChild(returndetailsDiv);
    }
    finalDiv.appendChild(flightInfoDiv);

    const flightUserInfoDiv = document.createElement("div");
    flightUserInfoDiv.classList.add("finalUserFlightBooking");

    for(let i=0; i<totalPass; i++){
        let eachDiv = document.createElement("div");
        const fname = document.getElementById(`fname-${i}`).value;
        const lname = document.getElementById(`lname-${i}`).value;
        const dob = document.getElementById(`dob-${i}`).value;
        const ssn = document.getElementById(`ssn-${i}`).value;
        eachDiv.innerHTML = `<p><b>Passenger ${i+1}: </b></p>`+`<p><b>First Name: </b> ${fname}</p>`+
        `<p><b>Last Name: </b> ${lname}</p>` + `<p><b>Date of Birth: </b> ${dob}</p>`+
        `<p><b>SSN: </b> ${ssn}</p>`;
        flightUserInfoDiv.appendChild(eachDiv);
    }
    finalDiv.appendChild(flightUserInfoDiv);

    const submitbtn = document.createElement("input");
    submitbtn.type = "submit";
    submitbtn.id = "fileUpdateSubmit";
    finalDiv.appendChild(submitbtn);
    document.getElementById('fileUpdateSubmit').addEventListener('click', function(event){
        event.preventDefault();
        updateFileDoc(totalPass, departFlightID, returnFlightID);
    });
}
function displayFlightDetails(){

    const mainDiv = document.getElementsByClassName("flightBookingDetails")[0];
    const flightDetailsVal = localStorage.getItem('flightVal');
    let totalPass = 0;
    let departFlightID = "";
    let returnFlightID = "";
    if(flightDetailsVal){
        const flightDetails = JSON.parse(flightDetailsVal);
        const price = parseInt(flightDetails.price);
        const adultNum = parseInt(flightDetails.adultPass);
        const childNum = parseInt(flightDetails.childPass);
        const infantNum = parseInt(flightDetails.infantPass);
        const adultPrice = price*adultNum;
        const childPrice = price*childNum*0.7;
        const infantPrice = price*infantNum*0.1;
        const totalPrice = adultPrice+childPrice+infantPrice;
        const detailsDiv = document.createElement("div");
        detailsDiv.innerHTML = `
        <h2>Flight Booking Details:</h2>
        <h3>Flight Details:</h3>
        <p><b>Flight ID: </b>${flightDetails.fId}</p>
        <p><b>Origin: </b>${flightDetails.origin}</p>
        <p><b>Destination: </b>${flightDetails.dest}</p>
        <p><b>Departure Date: </b>${flightDetails.departureDate}</p>
        <p><b>Arrival Date: </b>${flightDetails.arrivalDate}</p>
        <p><b>Departure Time: </b>${flightDetails.departureTime}</p>
        <p><b>Arrival Time: </b>${flightDetails.arrivalTime}</p>
        <p><b>Number of Adults: </b>${adultNum}</p>
        <p><b>Number of Children: </b>${childNum}</p>
        <p><b>Number of Infants: </b>${infantNum}</p>
        <p><b>Total Flight Price: </b>${totalPrice}</p>
        `;
        mainDiv.appendChild(detailsDiv);
        totalPass = adultNum+childNum+infantNum;
        departFlightID = flightDetails.fId;
    }
    
    const returnFlightDetailsVal = localStorage.getItem('returnFlightVal');
    if(returnFlightDetailsVal){
        const returnFlightDetails = JSON.parse(returnFlightDetailsVal);
        const returnprice = parseInt(returnFlightDetails.price);
        const returnadultNum = parseInt(returnFlightDetails.adultPass);
        const returnchildNum = parseInt(returnFlightDetails.childPass);
        const returninfantNum = parseInt(returnFlightDetails.infantPass);
        const returnadultPrice = returnprice*returnadultNum;
        const returnchildPrice = returnprice*returnchildNum*0.7;
        const returninfantPrice = returnprice*returninfantNum*0.1;
        const returntotalPrice = returnadultPrice+returnchildPrice+returninfantPrice;
        const returnDetailsDiv = document.createElement("div");
        returnDetailsDiv.classList.add("returnFlight");
        returnDetailsDiv.innerHTML = `
        <h3>Return Flight Details:</h3>
        <p><b>Flight ID: </b>${returnFlightDetails.fId}</p>
        <p><b>Origin: </b>${returnFlightDetails.origin}</p>
        <p><b>Destination: </b>${returnFlightDetails.dest}</p>
        <p><b>Departure Date: </b>${returnFlightDetails.departureDate}</p>
        <p><b>Arrival Date: </b>${returnFlightDetails.arrivalDate}</p>
        <p><b>Departure Time: </b>${returnFlightDetails.departureTime}</p>
        <p><b>Arrival Time: </b>${returnFlightDetails.arrivalTime}</p>
        <p><b>Number of Adults: </b>${returnadultNum}</p>
        <p><b>Number of Children: </b>${returnchildNum}</p>
        <p><b>Number of Infants: </b>${returninfantNum}</p>
        <p><b>Total Flight Price: </b>${returntotalPrice}</p>
        `;
        mainDiv.appendChild(returnDetailsDiv);
        returnFlightID = returnFlightDetails.fId;
    }
    userForms(totalPass,departFlightID,returnFlightID);
}
function userForms(totalPass, departFlightID, returnFlightID){
    const userDiv = document.getElementsByClassName("userFlightDetails")[0];
    const userForm = document.createElement("form");
    userForm.id = "userForms";
    for(let i=0; i<totalPass; i++){
        let eachDiv = document.createElement("div");
        eachDiv.classList.add("flightUserInfo");
        let flabel = document.createElement("label");
        flabel.htmlFor = `fname-${i}`;
        flabel.innerHTML = "First Name";
        
        let finput = document.createElement("input");
        finput.type = "text";
        finput.id = `fname-${i}`;
        finput.placeholder = "Enter your first name";
        finput.required = true;

        eachDiv.appendChild(flabel);
        eachDiv.appendChild(finput);

        let llabel = document.createElement("label");
        llabel.htmlFor = `lname-${i}`;
        llabel.innerHTML = "Last Name";
        
        let linput = document.createElement("input");
        linput.type = "text";
        linput.id = `lname-${i}`;
        linput.placeholder = "Enter your last name";
        linput.required = true;

        eachDiv.appendChild(llabel);
        eachDiv.appendChild(linput);

        let doblabel = document.createElement("label");
        doblabel.htmlFor = `dob-${i}`;
        doblabel.innerHTML = "Date of Birth";
        
        let dobinput = document.createElement("input");
        dobinput.type = "date";
        dobinput.id = `dob-${i}`;
        dobinput.required = true;

        eachDiv.appendChild(doblabel);
        eachDiv.appendChild(dobinput);

        let ssnlabel = document.createElement("label");
        ssnlabel.htmlFor = `ssn-${i}`;
        ssnlabel.innerHTML = "SSN";
        
        let ssninput = document.createElement("input");
        ssninput.type = "text";
        ssninput.id = `ssn-${i}`;
        ssninput.placeholder = "Enter your SSN";
        ssninput.required = true;

        eachDiv.appendChild(ssnlabel);
        eachDiv.appendChild(ssninput);

        userForm.appendChild(eachDiv);
    }
    const submitbtn = document.createElement("input");
    submitbtn.type = "submit";
    submitbtn.id = "finalsubmit";
    userForm.appendChild(submitbtn);
    userDiv.appendChild(userForm);

    document.getElementById('userForms').addEventListener('submit', function(event){
        event.preventDefault();
        displayFullInfo(totalPass, departFlightID, returnFlightID);
    })
}
function displayHotelDetails(){
    const hotelListVal = localStorage.getItem('hotelList');
    if(hotelListVal){
        const hotelList = JSON.parse(hotelListVal);
        const hotelDiv = document.getElementsByClassName("hotelBookings")[0];
        hotelDiv.innerHTML = `
        <h2><u>Hotel Booking Details:</u></h2>
        <p><b>Hotel ID: </b>${hotelList.hotelId}</p>
        <p><b>Hotel Name: </b>${hotelList.hotelName}</p>
        <p><b>City: </b>${hotelList.hotelCity}</p>
        <p><b>Number of Adults: </b>${hotelList.adultNum}</p>
        <p><b>Number of Children: </b>${hotelList.childNum}</p>
        <p><b>Number of Infants: </b>${hotelList.infantNum}</p>
        <p><b>Number of Rooms: </b>${hotelList.roomsNum}</p>
        <p><b>Price per night for each room: </b>${hotelList.price}</p>
        <p><b>Check In Date: </b>${hotelList.checkIn}</p>
        <p><b>Check Out Date: </b>${hotelList.checkOut}</p>
        <p><b>Total Price: </b>${hotelList.totalPrice}</p>
        `;
        const bookBtn = document.createElement("input");
        bookBtn.type = "submit";
        bookBtn.id = "finalSubmitHotel";
        hotelDiv.appendChild(bookBtn);
        document.getElementById("finalSubmitHotel").addEventListener("click", function(event){
            event.preventDefault();
            const jsonHotel = JSON.stringify(hotelList);
            const blob = new Blob([jsonHotel], { type: 'application/json' });

            // Create a download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'hotelConfirmation.json';
            a.click();

            // Revoke the URL to free up memory
            URL.revokeObjectURL(url);
        })
    }
}
document.addEventListener('DOMContentLoaded', () => {
    displayDateTime();
    setInterval(displayDateTime, 1000);
    applychanges();
    activePage();
    displayFlightDetails();
    displayHotelDetails();
});