var RETURN_KEY = 13; // constant to enable searching with the enter key
var map,infowindow,geocoder,markers = [];
	
var mLongitude,mLatitude;
var movie_base_url = "http://data.tmsapi.com/v1/movies/showings?";
var movie_api_key = "sm5ny69356s95875nkusjpcj";
var date;
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
	if(markers.length == 1)
	{
		mLatitude = latitude;
		mLongitude = longitude;
		searchMovies();
	}
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

	function searchMovies(){
		date = new Date();
		var day = date.getDate();
		var month = date.getMonth() + 1;
		var year = date.getFullYear();
		
		if(day<10) {
			day='0'+day;
		} 

		if(month<10) {
			month='0'+month;
		}

		var requestUri = movie_base_url +
			"startDate=" + year + 
			"-" + month +
			"-" + day + 
			"&lat=" + mLatitude + 
			"&lng=" + mLongitude + 
			"&api_key=" + movie_api_key;
		console.log(requestUri);
		$.getJSON(requestUri).done(function(data){movieJsonLoaded(data);});
	}
			
	function movieJsonLoaded(obj){
		if(obj.error){
			document.querySelector("#movie-content").innerHTML = "<b>No Results Found</b>";
		} else {
			var count = 0;
			var allMovies = obj;
			var bigString = "";
			//filter search by genre
			var genreFilter = document.querySelector("#Genre").value;
			for (var i=0;i<allMovies.length;i++){
				var movieName = allMovies[i].title;
				var genre;
				//if the movie has a genre then get them 
				if(allMovies[i].genres)
				{
					//used if there is more than one genre
					if(allMovies[i].genres.length > 1)
					{
						genre = allMovies[i].genres[0];
						for(var j = 1; j < allMovies[i].genres.length;j++){
							genre += ", " + allMovies[i].genres[j];
						}
					}
					else{
						genre = allMovies[i].genres[0];
					}
					//check to see if the genre matched the filter
					var genreLowerCase = genre.toLowerCase();
					var genreFilterLowerCase = genreFilter.toLowerCase();
					if(genreLowerCase.indexOf(genreFilterLowerCase) == -1 && genreFilter != " "){
						continue;
					}
				}
				//if you're searching for all movies then you don't need to filter through the search
				else if(genreFilter != " "){
					continue;
				}
				count++;
				
				//format the string
				var rating;
				if(allMovies[i].ratings)
				{
					rating = allMovies[i].ratings[0].code;
				}
				var showtimes = getShowtimes(allMovies[i].showtimes);
				
				var line = "<p>";
				line += "<h1>" + movieName + "</h1>";
				if(genre){
					line += "<em>Genre: " + genre + "</em> ";
				}
				else{
					line += "<em>Genre: N/A</em> ";
				}
				if(rating){
					line += "<em>Rating: " + rating + "</em> ";
				}
				else{
					line += "<em>Rating: Not Rated</em> ";
				}
				line += showtimes;
				line += "</p>";
				bigString += line;
			}
			//If no movies were found then let the user know
			if(count == 0){
				bigString = "<b>No Results Found</b>";
			}
			document.querySelector("#movie-content").innerHTML = bigString;
		}
	}
	
	function getShowtimes(movies){
		var line, theater, time, ticektUrl;
		var count = 0; //used to check if there are any showtimes for the movie left
		
		for(var i = 0;i < movies.length;i++){
			time = formatTime(movies[i].dateTime); //this changes time from military to standard
			//if the first theater hasn't been instantiated yet
			if(theater){
				//if it's still on the current theater then add the time to it
				if(theater == movies[i].theatre.name){
					//if formatTime returns a 0, that means the timing for the movie has passed
					//if it hasn't passed, add it to the list
					if(time != 0){
						line += time + " ";
						count++;
					}
					//if there aren't any times left and none have shown up, then inform the user
					if(movies[i+1] == null && count == 0){
						line += "No more showtimes for today";
					}
				}
				else{
				//inform the user if there aren't any times left
					if(count == 0){
						line += "No more showtimes for today";
					}
					count = 0;
					//if there is a link to fandango then give it to the user
					if(movies[i-1].ticketURI)
					{
						line += '<br><a href="' + movies[i-1].ticketURI + '">Buy tickets here!</a>';
					}
					theater = movies[i].theatre.name;
					line += "<br><br>" + theater + " - ";
					//add the time if it hasn't passed
					if(time != 0)
					{
						count++;
						line += time + " ";
					}
					// no timings available
					if(movies[i+1] == null && count == 0){
						line += "No more showtimes for today";
					}
				}
			}
			else{
				//first theater used to check later
				theater = movies[i].theatre.name;
				line = "<br>" + theater + " - ";
				if(time != 0)
				{
					count++;
					line += time + " ";
				}
				if(movies[i+1] == null && count == 0){
					line += "No more showtimes for today";
				}
			}
		}
		return line;
	}	
	
	//used to convert military time into standard and also check the timing to the current time
	//if the timing has passed, then return 0
	function formatTime(time){
		//the string is given as Month-Day-YearTHours:Minutes
		var splitString = time.split("T");
		var times = splitString[1].split(":");
		var hours = parseInt(times[0]);
		var minutes = parseInt(times[1]);
		var minuteString, end;
		var pm = false;
		
		//check current time to the movie timing
		//if it the current time is greater than the movie time the return 0
		var currentHour = date.getHours();
		var currentMinute = date.getMinutes();
		
		//used to turn the time into HoursMinutes so 10:15 would become 1015
		var currentTime = (currentHour * 100) + currentMinute;
		var movieTime = (hours * 100) + minutes;
		if(currentTime < movieTime){
			//convert military time to standard
			if(hours > 12){
				hours -= 12;
				pm = true;
			}
			else if(hours == 0){
				hours = 12;
			}
			if(minutes < 10)
			{
				minuteString = "0" + minutes;
			}
			else{
				minuteString = minutes;
			}
			
			if(pm){
				end = "pm";
			}
			else{
				end = "am";
			}
			return hours + ":" + minuteString + end;
		}
		return 0;
	}