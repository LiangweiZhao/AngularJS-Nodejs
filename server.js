var request = require('request');
var geoHash = require('ngeohash');
var SpotifyWebApi = require('spotify-web-api-node');
var express = require('express');
var app = express();

var spotifyApi = new SpotifyWebApi({
    clientId: 'YOUR_ID',
    clientSecret: 'YOUR_KEY',
    redirectUri: 'http://www.example.com/callback'
});
// Add headers

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});
//HomePage
app.use(express.static(__dirname+'/public'));
//Autocomplete
app.get('/items',function (req,res) {
    var data = req.query;
    var keyword = data.searchText, apikey = data.apikey;
    var query = "apikey=" + apikey + "&keyword=" + keyword;
    var url = "https://app.ticketmaster.com/discovery/v2/suggest?" + query;
    request(url,function (err,resp,body) {
        var json = JSON.parse(body);
        res.json(json);
    });
});
//Get Artist Require
app.get('/artist',function (req,res) {
    var dt = req.query;
    var keyword = dt.keyword;
    spotifyApi.searchArtists(keyword).then(function (data) {
        res.send(data);
    },function (err) {
        if(err.statusCode === 401){
            spotifyApi.clientCredentialsGrant().then(function(data) {
                    console.log('The access token expires in ' + data.body['expires_in']);
                    console.log('The access token is ' + data.body['access_token']);

                    // Save the access token so that it's used in future calls
                    spotifyApi.setAccessToken(data.body['access_token']);
                    // Call searchArtists() again
                    spotifyApi.searchArtists(keyword).then(function (data1) {
                        res.send(data1);
                    });
                },
                function(err) {
                    console.log('Something went wrong when retrieving an access token', err);
                }
            );
        }
    });
});
//Get Upcoming Events
app.get('/upcomingEvents',function (req,res) {
    var data = req.query;
    var apikey = data.apikey, query = data.query;
    var querySend = 'query=' + query + '&apikey=' + apikey;
    var url = "https://api.songkick.com/api/3.0/search/venues.json?" + querySend;
    request(url,function (err,resp,body) {
        var json = JSON.parse(body);
        if(!(json.resultsPage === undefined)&&((json.resultsPage.status==='ok')||(json.resultsPage.status==='OK'))){
            if(!(json.resultsPage.results===undefined) && !(json.resultsPage.results.venue===undefined)){
                var id = json.resultsPage.results.venue[0].id;
                var url1 = 'https://api.songkick.com/api/3.0/venues/'+id+'/calendar.json?apikey='+apikey;
                request(url1,function (err1,resp1,body1) {
                    var json1 = JSON.parse(body1);
                    res.json(json1);
                })
            }
        }else{
            res.json({'status':404});
        }
    })
});
//Get img of custom search Google
app.get('/imgs', function (req,res) {
    var data = req.query;
    var key = data.key, cx = data.cx, q = data.q, num = data.num;
    var imgSize = data.imgSize, searchType = data.searchType;
    var query = 'key=' + key + '&q=' + q + '&cx=' + cx + '&imgSize=' + imgSize + '&searchType=' + searchType + '&num=' + num;
    var url = "https://www.googleapis.com/customsearch/v1?" + query;
    request(url,function (err,resp,body) {
        var json = JSON.parse(body);
        res.json(json);
    });
});
//Get details of event
app.get('/details',function (req, res) {
    var data = req.query;
    var apikey = data.apikey, eventId = data.eventId;
    var query = eventId + ".json?" + "apikey=" + apikey;
    var url = "https://app.ticketmaster.com/discovery/v2/events/"+query;
    request(url,function (err,resp,body) {
        var json = JSON.parse(body);
        res.json(json);
    });
});
//Get all events which are related to keyword
app.get('/events.json',function (req, res) {
    var data = req.query;
    var segmentId = data.segmentId === undefined? "" : data.segmentId;
    var keyword = data.keyword,apikey = data.apikey;
    var radius = data.radius, lat = data.lat, lon = data.lon, unit = data.unit;
    var geoPoint = geoHash.encode(lat,lon);
    var query = "apikey="+apikey+"&keyword="+keyword+"&segmentId="+segmentId+"&radius="+radius+"&unit="+unit+"&geoPoint="+geoPoint;
    var url = "https://app.ticketmaster.com/discovery/v2/events.json?"+query;
    request(url,function (err,resp,body) {
        var json = JSON.parse(body);
        res.json(json);
    });
});
//Get lat and lon by location input
app.get('/locIP',function (req,res) {
    var data = req.query;
    var address = data.location, key = data.key;
    var query = "key="+key+"&address="+address;
    var url = "https://maps.googleapis.com/maps/api/geocode/json?"+query;
    request(url,function (err,resp,body) {
        var json = JSON.parse(body);
        res.json(json);
    })
});
var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port)
});