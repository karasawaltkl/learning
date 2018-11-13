var output_json;
var output_matchings;
var output_tracepoints;

var input_file = document.getElementById("inputfile");
input_file.addEventListener("change", inputEventLisner);

var steps_box = document.getElementById("steps");
var gaps_box = document.getElementById("gaps");
var tidy_box = document.getElementById("tidy");
var overview_box = document.getElementById("overview");
var timestamps_box = document.getElementById("timestamps");
var radiuses_box = document.getElementById("radiuses");
var tracking_num_box = document.getElementById("tracking_num");
var api_url = document.getElementById("api_url");

var input_circle_layers_list = new Array();
var output_circle_layers_list = new Array();
var output_geojson_layers = new Array();

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
	createTrackMatchingURL(createTrackMatchingParam());
	
	api_url.value = requestURL;

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

function createTrackMatchingParam()
{
	var macthing_param = new Object();
	
	// デフォルト
	macthing_param.steps = "false";          // true, false
	macthing_param.overview = "simplified";  // simplified, full, false
	macthing_param.gaps = "split"            // split, ignore
	macthing_param.tidy = "false";           // true, false
	macthing_param.timestamps = true;        // true, false
	macthing_param.radiuses = 0;            //  -1:invalid 1～50:valid
	
	// 設定値を取得
	macthing_param.steps = steps_box.value;
	macthing_param.overview = overview_box.value;
	macthing_param.gaps = gaps_box.value;
	macthing_param.tidy = tidy_box.value;
	macthing_param.timestamps = timestamps_box.value;
	macthing_param.radiuses = radiuses_box.value;
	
	return macthing_param;
}

function createTrackMatchingURL(param)
{
	var base_url = "https://router.project-osrm.org/match/v1/driving/";
	//var base_url = "https://api.mapbox.com/matching/v5/mapbox/driving/";
	var geojson_opt = "?geometries=geojson";
	//var access_token = "&access_token=xxxx";
	var steps_opt = "&steps="+param.steps;
	var overview_opt = "&overview="+param.overview;
	var gaps_opt = "&gaps="+param.gaps;
	var tidy_opt = "&tidy="+param.tidy;
	var timestamps_opt = "&timestamps=";
	var radiuses_opt = "&radiuses=";
	
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
	
	requestURL = requestURL + steps_opt + overview_opt + gaps_opt + tidy_opt;
	
	if(param.timestamps == "true"){
		for(var i=0; i<input_points.length; i++){
			timestamps_opt = timestamps_opt + input_points[i][2];
			if(i!=input_points.length-1){
				timestamps_opt = timestamps_opt + ";";
			}
		}
		requestURL = requestURL + timestamps_opt;
	}
	
	if(param.radiuses > 0){
		for(var i=0; i<input_points.length; i++){
			radiuses_opt = radiuses_opt + param.radiuses;
			if(i!=input_points.length-1){
				radiuses_opt = radiuses_opt + ";";
			}
		}
		requestURL = requestURL + radiuses_opt;
	}
}

function drawGeoJson(){
	for(var i=0; i<output_matchings.length; i++){
		var output_geojson = output_matchings[i].geometry;
		var geojson_layer =  L.geoJSON(output_geojson, {
					style:  {
					    "color": getLineStringColor(),
					    "weight": 5,
					    "opacity": 0.65
					}
				});
		output_geojson_layers.push(geojson_layer);
		geojson_layer.addTo(mymap);
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
	var output_circle_layers = new Array();
	for(var i=0; i<output_tracepoints.length; i++){
		if(output_tracepoints[i] != null){
			var lat = output_tracepoints[i].location[1];
			var lon = output_tracepoints[i].location[0];
			var point_location = [ lat, lon ];
			
			output_circle_layers.push( drawCircle(point_location, '#FF0000', (i+1)+"") );
		}
	}
	output_circle_layers_list.push(output_circle_layers);
}

function drawInputPoints()
{
	var input_circle_layers = new Array();
	for(var i=0; i<input_points.length; i++){
		var lat = input_points[i][1];
		var lon = input_points[i][0];
		var point_location = [ lat, lon ];
		input_circle_layers.push( drawCircle(point_location, '#0000FF', (i+1)+"") );
	}
	input_circle_layers_list.push(input_circle_layers);
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
	
	return CircleMarker;
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
				var timestamp = input_elements[1];
				var lonlat = [ lon, lat, timestamp ];
				input_points.push(lonlat);
			}
		}
		drawInputPoints();
		mymap.panTo(new L.LatLng(input_points[0][1],input_points[0][0]));
	};
	
	reader.readAsText( result[0] );
}

function removeInputPoint(){
	for(var layer_list of input_circle_layers_list){
		for(var layer of layer_list){
			mymap.removeLayer(layer);
		}
	}
	input_circle_layers_list = new Array();
}

function removeTracking(){
	var index = parseInt(tracking_num_box.value) - 1;
	
	if(index < 0){
		//全削除
		for(var layer_list of output_circle_layers_list){
			for(var layer of layer_list){
				mymap.removeLayer(layer);
			}
		}
		output_circle_layers_list = new Array();
		for(var layer of output_geojson_layers){
			mymap.removeLayer(layer);
		}
		output_geojson_layers = new Array();
	}
	else{
		//指定インデックスのみ削除
		if(index < output_circle_layers_list.length){
			for(var layer of output_circle_layers_list[index]){
				mymap.removeLayer(layer);
			}
			output_circle_layers_list.splice(index,1);
			mymap.removeLayer(output_geojson_layers[index]);
			output_geojson_layers.splice(index,1);
		}
	}
}