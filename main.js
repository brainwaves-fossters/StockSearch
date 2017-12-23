var express = require('express');
var https = require('https');
var request = require("request");
var bodyParser = require('body-parser');
var path = require('path');
var xml2js = require('xml2js');

var parser = new xml2js.Parser();
var parseString = require('xml2js').parseString;

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
//myApp.use(express.static('/Library/WebServer/Documents/webTechAssignment/Assign8'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/getStockDetails', function(requestObj, response) {
	console.log("Request inititated.");
    var stockSymbol = requestObj.query.stockSymbol;
    var requestURL = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&outputsize=full&symbol=' + stockSymbol + '&apikey=EKEHOXYWOI44F4H9';
    request({
        url: requestURL,
        json: true
    }, function(errorObj, responseObj, body) {
    	console.log("Inside");
    	console.log(requestURL);
        if (!errorObj && responseObj.statusCode === 200) {

        	console.log("Success with data : " + body['timeSeriesData'] + " And status : " + responseObj.statusCode);
            var stockDetailsObj = {
                stockData: body
            };
            response.send(stockDetailsObj);
        } else {
            console.log(response.data);
        }
    });
});

app.get('/getIndicatorValues', function(requestObj, response) {
    var stockSymbol = requestObj.query.stockSymbol;
    var indicator = requestObj.query.indicator;
    var requestURL = 'https://www.alphavantage.co/query?function=' + indicator + '&symbol=' + stockSymbol + '&interval=daily&time_period=10&series_type=close&apikey=EKEHOXYWOI44F4H9';
   
    request({
        url: requestURL,
        json: true
    }, function(errorObj, responseObj, body) {
    	console.log(requestURL);
        if (!errorObj && responseObj.statusCode === 200) {
        	var stockDetailsObj = {
                stockData: body
            };
            response.send(stockDetailsObj);
        } else {
            console.log(response.data);
        }
    });
});

app.get('/getNewsFeed', function(requestObj, response){
    var stockSymbol = requestObj.query.stockSymbol;
    var requestURL = 'https://seekingalpha.com/api/sa/combined/' + stockSymbol + '.xml';
    
    request({
        url: requestURL,
        xmlns: true
    }, function(errorObj, responseObj, body) {
    	console.log(requestURL);
        if (!errorObj && responseObj.statusCode === 200) {
        	parseString(body, function(err, result) {
        		jsonVal = result;        				        				
      		});
            var stockDetailsObj = {
                stockData: jsonVal
            };
      		response.send(stockDetailsObj);;
        } else {
            console.log(response.data);
        }
    });
});

console.log("Reloaded the app..");
module.exports = app;