(function(){
	var RETURN_KEY = 13;
	var map,infowindow,geocoder,markers = [];

	window.onload = init;
	
	function init(){
		document.querySelector("#search").onclick = search;
		document.querySelector("#currentaddress").onkeyup = doKeyup;

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
            "callback=" + "handleResults" +
            "&term=" + document.getElementById("term").value + 
            "&num_biz_requested=10" +
            "&tl_lat=" + mapBounds.getSouthWest().lat() +
            "&tl_long=" + mapBounds.getSouthWest().lng() + 
            "&br_lat=" + mapBounds.getNorthEast().lat() + 
            "&br_long=" + mapBounds.getNorthEast().lng() +
            "&ywsid=" + YWSID;
        return encodeURI(URL);
    }
	
	function doKeyup(e){
		if(e.keyCode == RETURN_KEY){
			search();
		}
	}

	function zoomOnFirstResult(){
		if(markers.length === 0) return;
		var temp = {lat:markers[0].position.k,lng:markers[0].position.B};
		debugger;
		map.setCenter(temp);
		map.setZoom(15);
	}
	
	function search(){
		clearMarkers();
		// get value of area code
		var currentAddress = document.querySelector("#currentaddress").value;
		
		// get rid of any leading and trailing spaces
		currentAddress = currentAddress.trim();
		
		// if there's no band to search then bail out of the function (return does this)
		if(currentAddress.length < 1) return;
		
		document.querySelector("#currentaddress").innerHTML = "<b>Searching for " + currentAddress + "</b>";
		
		// https://developers.google.com/maps/documentation/javascript/examples/geocoding-simple
		geocoder.geocode( { 'address': currentAddress}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
			    map.setCenter(results[0].geometry.location);
			    var marker = new google.maps.Marker({
			        map: map,
			        position: results[0].geometry.location,
			    });
			    markers.push(marker);
			    map.setZoom(15);
			} else {
			    alert('Address could not be found: ' + status);
			}
		});

		// Find restuarants nearby and place markers for them as well
	}

	function addMarker(latitude,longitude,title){
		var position = {lat:latitude,lng:longitude};
		var marker = new google.maps.Marker({position:position, map:map});
		marker.title = title;
		google.maps.event.addListener(marker, 'click', function(e){ makeInfoWindow(this.position.this.title); });
		markers.push(marker);
	}
	
	function makeInfoWindow(position,msg){
		if(infowindow) infowindow.close();

		infowindow = new google.maps.InfoWindow({
			map: map,
			position:position,
			content: "<b>" + msg + "</b>"
		});
	}

	function clearMarkers(){
		if(infowindow){ infowindow.close(); }
		for(var i = 0; i < markers.length; i++){
			markers[i].setMap(null);
		}
		markers = [];
	}
}());