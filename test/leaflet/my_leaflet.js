var output_json;
var output_matchings;
var output_tracepoints;

var input_file = document.getElementById("inputfile");
input_file.addEventListener("change", inputEventLisner);

var mymap = L.map('mapid').setView([35.73079573810729,139.74938308635552], 14);

//MapBoxレイヤー追加
//L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
//    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery ? <a href="http://mapbox.com">Mapbox</a>',
//    maxZoom: 18,
//    id: 'mapbox.streets',
//    accessToken: 'xxxx'
//}).addTo(mymap);

//OSMレイヤー追加
L.tileLayer(
	'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	{
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
		maxZoom: 18
	}
).addTo(mymap);

var requestURL = "";
function drawTracking(){
	createTrackMatchingURL();

	var xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				output_json = JSON.parse(xmlhttp.responseText);
				output_matchings = output_json.matchings;
				output_tracepoints = output_json.tracepoints;
				
				drawGeoJson();
				drawTracepoints();
			} else {
			}
		}
	}
	xmlhttp.open("GET", requestURL);
	xmlhttp.send();
}

function createTrackMatchingURL()
{
	var base_url = "https://router.project-osrm.org/match/v1/driving/";
	//var base_url = "https://api.mapbox.com/matching/v5/mapbox/driving/";
	var geojson_opt = "?geometries=geojson";
	var access_token = "&access_token=xxxx"
	requestURL = base_url;
	for(var i=0; i<input_points.length; i++){
		var lonlat = input_points[i][0] + "," + input_points[i][1];
		if(i!=input_points.length-1){
			lonlat = lonlat + ";";
		}
		requestURL = requestURL + lonlat;
	}
	requestURL = requestURL + geojson_opt;
	
	//Mapbox利用時
	//requestURL = requestURL + access_token;
}

function drawGeoJson(){
	for(var i=0; i<output_matchings.length; i++){
		var output_geojson = output_matchings[i].geometry;
		L.geoJSON(output_geojson, {
					style:  {
					    "color": getLineStringColor(),
					    "weight": 5,
					    "opacity": 0.65
					}
				}).addTo(mymap);
	}
}

var count = 0;
function getLineStringColor(){
	var color;
	switch(count % 5){
		case 0:
			color = "#00ff00";
			break;
		case 1:
			color = "#ff00ff";
			break;
		case 2:
			color = "#00ffff";
			break;
		case 3:
			color = "#ffff00";
			break;
		case 4:
			color = "#9999dd";
			break;
	}
	count = count + 1;
	
	return color;
}

function drawTracepoints(){
	for(var i=0; i<output_tracepoints.length; i++){
		if(output_tracepoints[i] != null){
			var lat = output_tracepoints[i].location[1];
			var lon = output_tracepoints[i].location[0];
			var point_location = [ lat, lon ];
			
			drawCircle(point_location, '#FF0000', (i+1)+"");
		}
	}
}

function drawInputPoints()
{
	for(var i=0; i<input_points.length; i++){
		var lat = input_points[i][1];
		var lon = input_points[i][0];
		var point_location = [ lat, lon ];
			
		drawCircle(point_location, '#0000FF', (i+1)+"");
	}
}

function drawCircle(location, fill_color, label)
{
	var CircleMarker = L.circleMarker(location, {
	    color: fill_color,
	    weight: 3,
	    opacity: 0.8,
	    fillColor: fill_color,
	    fillOpacity: 0.8,
	})
	
	CircleMarker.setRadius(3);
	CircleMarker.bindPopup(label).addTo(mymap);
}

var input_points;
function inputEventLisner(e){
	input_points = new Array();
	
	var result = e.target.files;
	var reader = new FileReader();
	
	reader.onload = function(e){
		var input_line = reader.result.split('\n');
		for(var i=0; i<input_line.length; i++){
			var input_elements = input_line[i].split(',');
			
			if(input_line[i].length >= 4){
				var lon = input_elements[2];
				var lat = input_elements[3];
				var timestamp = input_elements[0];
				var lonlat = [ lon, lat, timestamp ];
				input_points.push(lonlat);
			}
		}
		drawInputPoints();
		mymap.panTo(new L.LatLng(input_points[0][1],input_points[0][0]));
	};
	
	reader.readAsText( result[0] );
}
