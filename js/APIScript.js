var RETURN_KEY = 13; // constant to enable searching with the enter key
var map,infowindow,geocoder,markers = [];

window.onload = init;

var searchedFood,searchedAddress;
function init(){
	document.querySelector("#search").onclick = searchAddress;

	searchedFood = document.getElementById("foodSearch");
	searchedFood.addEventListener("click", function() {if(searchedFood.value === "ex:pizza,sushi"){searchedFood.value = '';}});
	searchedFood.onkeyup = doKeyup;
	searchedAddress = document.getElementById("addressSearch");
	searchedAddress.addEventListener("click", function() {if(searchedAddress.value === "ex:5555 Fake St."){searchedAddress.value = '';}});
	searchedAddress.onkeyup = doKeyup;

	var mapOptions = {
		center: { lat: 39.828127, lng: -98.579404},
		zoom: 3
	};
	map = new google.maps.Map(document.getElementById('map-div'),mapOptions);
	geocoder = new google.maps.Geocoder(); // used for address lookup
}

function constructYelpURL() {
    var mapBounds = map.getBounds();
    var URL = "http://api.yelp.com/" +
        "business_review_search?"+
        "callback=" + "handleYelpResults" +
        "&term=" + searchedFood.value + 
        "&num_biz_requested=10" +
        "&tl_lat=" + mapBounds.getSouthWest().lat() +
        "&tl_long=" + mapBounds.getSouthWest().lng() + 
        "&br_lat=" + mapBounds.getNorthEast().lat() + 
        "&br_long=" + mapBounds.getNorthEast().lng() +
        "&ywsid=" + "7Uao386mmq6H0Vz44NjqEw";
    return encodeURI(URL);
}

function handleYelpResults(data){
    if(data.message.text == "OK") {
    	console.log(data.businesses.length);
        if (data.businesses.length == 0) {
            alert("No businesses were found near your location");
            return;
        }
        for(var i=0; i<data.businesses.length; i++) {
        	// The Yelp API Only returns the lat and lng of a business sometimes. But it always returns the address. So we check to see if it provides its own lat and lng, and if it doesn't we use the google maps geocoder to find it.
        	if(data.businesses[i].latitude === undefined){
        		var formattedAddress = data.businesses[i].address1;
        		formattedAddress += (" " + data.businesses[i].city + " " + data.businesses[i].state_code + " " + data.businesses[i].zip);
        		addressLookup(formattedAddress,data.businesses[i].name);
        	} else {
            	addMarker(data.businesses[i].latitude,data.businesses[i].longitude,data.businesses[i].name);
        	}
        }
    } else { alert("Error: " + data.message.text); }
}

// Finds entered address, places a marker there, runs callback function
// https://developers.google.com/maps/documentation/javascript/examples/geocoding-simple
function addressLookup(address, name, callback){
	geocoder.geocode( { 'address': address}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
		    addMarker(results[0].geometry.location.k,results[0].geometry.location.B,name);
		} else if(status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
			setTimeout(function() {
                console.log("struggling with geocoder api, loading...");
                addressLookup(address,name,callback);
            }, 2000);
		} else { alert('Address could not be found: ' + status); }
		if(callback != undefined){callback(results[0].geometry.location);} // closures! neato!
	});
}

function doKeyup(e){ // search on enter key press
	if(e.keyCode == RETURN_KEY){ searchAddress(); }
}

var yelpURL;
function searchAddress(){
	clearMarkers();
	// trim spaces, if no address then exit
	searchedAddress.value = searchedAddress.value.trim();
	if(searchedAddress.value < 1) return;
	
	var afterLookup = function(locationOfFirstResult){
		map.setCenter(locationOfFirstResult);
		map.setZoom(14);
		searchYelp();
	};

	addressLookup(searchedAddress.value,"Your Location",afterLookup);
    return false;
}

function searchYelp(){
	yelpURL = constructYelpURL();
	var script = document.createElement('script');
    script.src = yelpURL;
    script.type = 'text/javascript';
    var head = document.getElementsByTagName('head').item(0);
    head.appendChild(script);
}

function addMarker(latitude,longitude,title){
	var position = {lat:latitude,lng:longitude};
	var marker = new google.maps.Marker({position:position, map:map});
	marker.title = title;
	google.maps.event.addListener(marker, 'click', function(e){ makeInfoWindow(position,title); });
	markers.push(marker);
}

function makeInfoWindow(position,msg){
	if(infowindow) infowindow.close();
	infowindow = new google.maps.InfoWindow({
		map: map,
		position:position,
		content:msg
	});
}

function clearMarkers(){
	if(infowindow){ infowindow.close(); }
	for(var i = 0; i < markers.length; i++){
		markers[i].setMap(null);
	}
	markers = [];
}