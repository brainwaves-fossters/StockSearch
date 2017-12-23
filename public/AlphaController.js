var app = angular.module("AlphaApp", ["ngRoute"]);
app.config(function($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "Favorites.html"
        })
        .when("/stockDetails", {
            templateUrl: "StockDetails.html",
            controller: "mainControl"
        });
});

app.controller('mainControl', ['$scope', '$http', 'stockService', function($scope, $http, stockService) {

    $scope.getFavoritesList = function() {
        if (typeof(Storage) !== "undefined") {
            var keys = Object.keys(localStorage);

            $scope.favList = [];
            for (key in keys) {
                $scope.favList.push(JSON.parse(localStorage.getItem(keys[key])));
            }

            console.log($scope.favList);
        }
    }

    $scope.getFavoritesList();
    $scope.favIcon = "glyphicon glyphicon-star-empty";

    $scope.displayGivenSymbolData = function(symbol) {
        $scope.symbolInput = symbol;
        window.location.href = "#!stockDetails";
        $scope.displayStockDetails();
    }

    $scope.deleteFromStorage = function(symbol) {
        if (localStorage.getItem(symbol.toUpperCase()) != null) {
            localStorage.removeItem(symbol.toUpperCase());
        }
        $scope.getFavoritesList();
    }

    $scope.checkIfSymbolIsFavorite = function(symbol) {
        if (localStorage.getItem(symbol.toUpperCase()) != null) {
            return true;
        }
        return false;
    }

    $scope.showFavoritesTab = function() {
        $scope.getFavoritesList();
        window.location.href = "/";
        //location.reload();
        //window.location.href = "#!";

    }

    $scope.initializeVariables = function() {
        $scope.globalSMAResponseData = "invalid";
        $scope.globalEMAResponseData = "invalid";
        $scope.globalSTOCHResponseData = "invalid";
        $scope.globalRSIResponseData = "invalid";
        $scope.globalADXResponseData = "invalid";
        $scope.globalCCIResponseData = "invalid";
        $scope.globalBBANDSResponseData = "invalid";
        $scope.globalMACDResponseData = "invalid";
        $scope.globalNewsFeedData = "invalid";
        $scope.newsFeedLoaded = false;

        $scope.indicatorSize = 127;

        if($scope.checkIfSymbolIsFavorite($scope.symbolInput)){
            $scope.showNotFavorite = false;
        }
        else
        {
            $scope.showNotFavorite = true;
        }
        
    }

    $scope.clearClicked = function() {
        document.getElementById("symbolInput").value = "";
        console.log("Cleared");
    }


    // Called after clicking GetQuotes
    $scope.displayStockDetails = function() {
        // This function is called when we click "GetQuotes"
        // We reset all the global variables so that it can be reloaded
        // We call each of the stock service i.e. to fetch stock price and all the indicator.
        // Since the services run in parallel and each service will send a request to NodeJS, it all runs in parallel. 

        $scope.initializeVariables();
        $scope.stockService = stockService;
        console.log("Inside displayStockDetails function : " + $scope.symbolInput);

        stockService.getStockPrice($scope.symbolInput).then(function(response) {
            // Call the service to fetch stock price values. Parse this response json to fetch required field in the table.
            // Load the historical chart as well.

            if (response.status == 200) {
                var responseMainData = response.data;
                var jsonTimeSeriesData = responseMainData['stockData'];

                $scope.timeSeriesData = response.data;

                var tempVar = jsonTimeSeriesData;
                if (!tempVar.hasOwnProperty('Meta Data')) {
                    alert('Oops! Failed to load data from Alphavantage for the given symbol; Try again later!');
                    window.location.href = "#/!";
                    return;
                }

                $scope.stockTickerSymbol = jsonTimeSeriesData['Meta Data']['2. Symbol'];
                $scope.timeStamp = jsonTimeSeriesData['Meta Data']['3. Last Refreshed'];

                $scope.timeSeries = jsonTimeSeriesData["Time Series (Daily)"];

                var countIterator = 0;
                for (dateIterator in $scope.timeSeries) {
                    if (countIterator == 0) {
                        $scope.currentDayPriceClose = parseFloat($scope.timeSeries[dateIterator]["4. close"]).toFixed(2);
                        $scope.currentDayOpen = parseFloat($scope.timeSeries[dateIterator]["1. open"]).toFixed(2);

                        $scope.currentDayLow = parseFloat($scope.timeSeries[dateIterator]["3. low"]).toFixed(2);
                        $scope.currentDayHigh = parseFloat($scope.timeSeries[dateIterator]["2. high"]).toFixed(2);
                        $scope.currentDayVolume = $scope.timeSeries[dateIterator]["5. volume"];
                    } else if (countIterator == 1) {
                        $scope.previousDayClose = parseFloat($scope.timeSeries[dateIterator]["4. close"]).toFixed(2);
                    } else {
                        break;
                    }
                    countIterator++;
                }

                $scope.stockChange = ($scope.currentDayPriceClose - $scope.previousDayClose).toFixed(2);
                $scope.stockChangePercent = (($scope.stockChange) / ($scope.previousDayClose) * 100).toFixed(2);

                if ($scope.stockChange >= 0) {
                    $scope.stockArrow = "http://cs-server.usc.edu:45678/hw/hw6/images/Green_Arrow_Up.png";
                } else {
                    $scope.stockArrow = "http://cs-server.usc.edu:45678/hw/hw6/images/Red_Arrow_Down.png";
                }

                $scope.loadPriceVolumeChart();
                $scope.loadHistoricalChart();
                $scope.loadNewsfeed();
            }
        });

        // Call each of the indicators to fetch their data. Store it in a global variable and access it while displaying
        // Why different functions? So that you request each indicator data in parallel. Speed!
        stockService.getIndicatorStocks($scope.symbolInput, "SMA").then(function(response) {
            if (response.status == 200) {
                $scope.globalSMAResponseData = response.data['stockData'];
            } else {
                console.log("SMA not loaded");
            }
        });

        stockService.getIndicatorStocks($scope.symbolInput, "EMA").then(function(response) {
            if (response.status == 200) {
                $scope.globalEMAResponseData = response.data['stockData'];
            } else {
                console.log("EMA not loaded");
            }
        });

        stockService.getIndicatorStocks($scope.symbolInput, "STOCH").then(function(response) {
            if (response.status == 200) {
                $scope.globalSTOCHResponseData = response.data['stockData'];
            } else {
                console.log("STOCH not loaded");
            }
        });

        stockService.getIndicatorStocks($scope.symbolInput, "RSI").then(function(response) {
            if (response.status == 200) {
                $scope.globalRSIResponseData = response.data['stockData'];
            } else {
                console.log("RSI not loaded");
            }
        });

        stockService.getIndicatorStocks($scope.symbolInput, "ADX").then(function(response) {
            if (response.status == 200) {
                $scope.globalADXResponseData = response.data['stockData'];
            } else {
                console.log("ADX not loaded");
            }
        });

        stockService.getIndicatorStocks($scope.symbolInput, "CCI").then(function(response) {
            if (response.status == 200) {
                $scope.globalCCIResponseData = response.data['stockData'];
            } else {
                console.log("CCI not loaded");
            }
        });

        stockService.getIndicatorStocks($scope.symbolInput, "BBANDS").then(function(response) {
            if (response.status == 200) {
                $scope.globalBBANDSResponseData = response.data['stockData'];
            } else {
                console.log("BBANDS not loaded");
            }
        });

        stockService.getIndicatorStocks($scope.symbolInput, "MACD").then(function(response) {
            if (response.status == 200) {
                $scope.globalMACDResponseData = response.data['stockData'];
            } else {
                console.log("MACD not loaded");
            }
        });

        stockService.getNewsFeed($scope.symbolInput).then(function(response) {
            if (response.status == 200) {
                $scope.globalNewsFeedData = response.data['stockData'];
            } else {
                console.log("Newsfeed not loaded");
            }
        });

        /*      stockService.getNewsFeed($scope.symbolInput).then(function(response) {
                  // Fetching Newsfeed part
                  $scope.responseStatus3 = response.status;
                  $scope.responseData3 = response.data;
              });*/


        //Call other services and set the rootscope.
    };

    // Use the fetched data of stock price and parse it for the required fields
    $scope.loadPriceVolumeChart = function() {
        var jsonTimeSeriesData = $scope.timeSeriesData['stockData'];
        var symbol = $scope.stockTickerSymbol;

        var src = "<a href=\"https://www.alphavantage.co/\" target=\"_blank\" style=\"color:blue; text-decoration:none;\">Source: Alpha Vantage</a>";

        var timeSeriesData = jsonTimeSeriesData["Time Series (Daily)"];

        var stockPriceSeries = [];
        var volumeSeries = [];
        var dateSeries = [];
        var processedPriceSeries = [];
        var processedVolumeSeries = [];

        var index = 0;
        for (var date in timeSeriesData) {
            if (index > $scope.indicatorSize) {
                break;
            }
            stockPriceSeries[index] = parseFloat(timeSeriesData[date]["4. close"]);
            volumeSeries[index] = parseFloat(timeSeriesData[date]["5. volume"]);
            var j = date.split("-");
            dateSeries[index] = j[1] + "/" + j[2];
            index++;
        }

        for (var i = 0; i < dateSeries.length; i++) {
            processedPriceSeries.push([dateSeries[i], stockPriceSeries[i]]);
            processedVolumeSeries.push([dateSeries[i], volumeSeries[i]]);
        }

        $scope.processedVolumeSeriesData = processedVolumeSeries;

        $scope.highchartParams = {
            chart: {
                zoom: 'xy',
                renderTo: 'indicatorContainer'
            },

            title: {
                text: symbol + ' Stock Price and Volume'
            },

            subtitle: {
                useHTML: true,
                text: src
            },

            xAxis: {
                reversed: true,
                tickInterval: 10,
                labels: {
                    rotation: -45,
                    step: 1
                },
                categories: dateSeries
            },

            yAxis: [{
                    title: {
                        text: 'Stock Price'
                    }
                },
                {
                    title: {
                        text: 'Volume'
                    },
                    opposite: true
                }
            ],


            series: [{
                    type: 'area',
                    name: 'Price',
                    data: processedPriceSeries
                },
                {
                    type: 'column',
                    name: 'Volume',
                    yAxis: 1,
                    data: processedVolumeSeries
                }
            ]
        };

        Highcharts.chart('indicatorContainer', $scope.highchartParams);
    };

    $scope.loadNewsfeed = function() {
        var tempVar = $scope.globalNewsFeedData;
        if (!tempVar.hasOwnProperty('rss')) {
            $scope.stockService.getNewsFeed($scope.symbolInput).then(function(response) {
                if (response.status == 200) {
                    $scope.globalNewsFeedData = response.data['stockData'];
                    console.log("NewsFeed reloaded");
                } else {
                    console.log("Newsfeed not loaded");
                }
            });
        }

        if ($scope.globalNewsFeedData.hasOwnProperty('rss')) {
            var jsonNewsData = $scope.globalNewsFeedData;
            var index = 0;
            var titleArray = [],
                linkArray = [],
                publicationDateArray = [],
                authorArray = [];
            $scope.newsFeedArray = [];

            items = jsonNewsData.rss.channel[0]['item'];
            for (item in items) {
                if (index == 5) {
                    break;
                }
                link = items[item]['link'][0];
                if (link.match(/article/)) {
                    var newLink = link; //.substring(8)
                    linkArray[index] = { 'links': newLink };
                    titleArray[index] = { 'title': items[item]['title'][0] };
                    authorArray[index] = { 'author': items[item]['sa:author_name'][0] };

                    var pubDate = items[item]['pubDate'][0];
                    var dateObj = pubDate.split("-");
                    publicationDateArray[index] = { 'pubDate': dateObj[0] };

                    index++;
                }
            }

            for (title in titleArray) {
                $scope.newsFeedArray.push([linkArray[title], titleArray[title], authorArray[title], publicationDateArray[title]]);
            }
            $scope.newsFeedLoaded = true;
        } else {
            $scope.newsFeedLoaded = false;
        }
    }

    $scope.loadNewsFeedIfNotLoaded = function() {
        if ($scope.newsFeedLoaded == false) {
            $scope.loadNewsfeed();
        }
    }

    // Every chart will call their own functions because you want to check if that function's data is already fetched or not.
    // If it's not loaded, you manually call the service to load that data first and display it if you successfully load it.
    $scope.loadSMAChart = function() {
        var tempVar = $scope.globalSMAResponseData;
        if (tempVar.hasOwnProperty('Meta Data')) {
            $scope.showIndicatorChart("SMA", $scope.globalSMAResponseData);
        } else {
            $scope.stockService.getIndicatorStocks($scope.symbolInput, "SMA").then(function(response) {
                if (response.status == 200) {
                    $scope.globalSMAResponseData = response.data['stockData'];
                    console.log("SMA data was reloaded");
                    $scope.loadSMAChart();
                } else {
                    console.log("SMA not loaded");
                }
            });
        }
    };

    $scope.loadEMAChart = function() {
        var tempVar = $scope.globalEMAResponseData;
        if (tempVar.hasOwnProperty('Meta Data')) {
            $scope.showIndicatorChart("EMA", $scope.globalEMAResponseData);
        } else {
            $scope.stockService.getIndicatorStocks($scope.symbolInput, "EMA").then(function(response) {
                if (response.status == 200) {
                    $scope.globalEMAResponseData = response.data['stockData'];
                    console.log("EMA data was reloaded");
                    $scope.loadEMAChart();
                } else {
                    console.log("EMA not loaded");
                }
            });
        }
    };

    $scope.loadSTOCHChart = function() {
        var tempVar = $scope.globalSTOCHResponseData;
        if (tempVar.hasOwnProperty('Meta Data')) {
            $scope.showIndicatorChart("STOCH", $scope.globalSTOCHResponseData);
        } else {
            $scope.stockService.getIndicatorStocks($scope.symbolInput, "STOCH").then(function(response) {
                if (response.status == 200) {
                    $scope.globalSTOCHResponseData = response.data['stockData'];
                    console.log("STOCH data was reloaded");
                    $scope.loadSTOCHChart();
                } else {
                    console.log("STOCH not loaded");
                }
            });
        }
    };

    $scope.loadRSIChart = function() {
        var tempVar = $scope.globalRSIResponseData;
        if (tempVar.hasOwnProperty('Meta Data')) {
            $scope.showIndicatorChart("RSI", $scope.globalRSIResponseData);
        } else {
            $scope.stockService.getIndicatorStocks($scope.symbolInput, "RSI").then(function(response) {
                if (response.status == 200) {
                    $scope.globalRSIResponseData = response.data['stockData'];
                    console.log("RSI data was reloaded");
                    $scope.loadRSIChart();
                } else {
                    console.log("RSI not loaded");
                }
            });
        }
    };

    $scope.loadADXChart = function() {
        var tempVar = $scope.globalADXResponseData;
        if (tempVar.hasOwnProperty('Meta Data')) {
            $scope.showIndicatorChart("ADX", $scope.globalADXResponseData);
        } else {
            $scope.stockService.getIndicatorStocks($scope.symbolInput, "ADX").then(function(response) {
                if (response.status == 200) {
                    $scope.globalADXResponseData = response.data['stockData'];
                    console.log("ADX data was reloaded");
                    $scope.loadADXChart();
                } else {
                    console.log("ADX not loaded");
                }
            });
        }
    };

    $scope.loadCCIChart = function() {
        var tempVar = $scope.globalCCIResponseData;
        if (tempVar.hasOwnProperty('Meta Data')) {
            $scope.showIndicatorChart("CCI", $scope.globalCCIResponseData);
        } else {
            $scope.stockService.getIndicatorStocks($scope.symbolInput, "CCI").then(function(response) {
                if (response.status == 200) {
                    $scope.globalCCIResponseData = response.data['stockData'];
                    console.log("CCI data was reloaded");
                    $scope.loadCCIChart();
                } else {
                    console.log("CCI not loaded");
                }
            });
        }
    };

    $scope.loadBBANDSChart = function() {
        var tempVar = $scope.globalBBANDSResponseData;
        if (tempVar.hasOwnProperty('Meta Data')) {
            $scope.showIndicatorChart("BBANDS", $scope.globalBBANDSResponseData);
        } else {
            $scope.stockService.getIndicatorStocks($scope.symbolInput, "BBANDS").then(function(response) {
                if (response.status == 200) {
                    $scope.globalBBANDSResponseData = response.data['stockData'];
                    console.log("BBANDS data was reloaded");
                    $scope.loadBBANDSChart();
                } else {
                    console.log("BBANDS not loaded");
                }
            });
        }
    };

    $scope.loadMACDChart = function() {
        var tempVar = $scope.globalMACDResponseData;
        if (tempVar.hasOwnProperty('Meta Data')) {
            $scope.showIndicatorChart("MACD", $scope.globalMACDResponseData);
        } else {
            $scope.stockService.getIndicatorStocks($scope.symbolInput, "MACD").then(function(response) {
                if (response.status == 200) {
                    $scope.globalMACDResponseData = response.data['stockData'];
                    console.log("MACD data was reloaded");
                    $scope.loadMACDChart();
                } else {
                    console.log("MACD not loaded");
                }
            });
        }
    };

    $scope.shareOnFaceBook = function() {
        var highchartOptionData = {
            options: JSON.stringify($scope.highchartParams),
            async: true
        };

        var highChartUrl = 'http://export.highcharts.com/';

        $.post(highChartUrl, highchartOptionData, function(data) {
            var pictureUrl = highChartUrl + data;

            FB.ui({
                app_id: "130454030975892",
                method: 'feed',
                name: 'Facebook Dialogs',
                picture: pictureUrl
            }, function(response) {
                if (response != undefined) {
                    alert('Posted Successfully');
                    self.close();
                } else {
                    alert('Not Posted')
                }
            });

        });
    }

    $scope.updateFavoritesList = function() {
        if (typeof(Storage) !== "undefined") {
            $scope.favIcon = "glyphicon glyphicon-star";
            var stockDetailsForSymbol = {};

            stockDetailsForSymbol.symb = $scope.stockTickerSymbol.toUpperCase();
            stockDetailsForSymbol.stockPrice = parseFloat($scope.currentDayPriceClose);
            stockDetailsForSymbol.stockChange = parseFloat($scope.stockChange);
            stockDetailsForSymbol.stockChangePercent = parseFloat($scope.stockChangePercent);
            stockDetailsForSymbol.volume = parseInt($scope.currentDayVolume);

            if ($scope.stockChange >= 0) {
                stockDetailsForSymbol.img = "http://cs-server.usc.edu:45678/hw/hw6/images/Green_Arrow_Up.png";
            } else {
                stockDetailsForSymbol.img = "http://cs-server.usc.edu:45678/hw/hw6/images/Red_Arrow_Down.png";
            }

            localStorage.setItem(stockDetailsForSymbol.symb, JSON.stringify(stockDetailsForSymbol));

            console.log(stockDetailsForSymbol.symb + " : " + stockDetailsForSymbol);
            $scope.getFavoritesList();
        }
    }

    // Load the historical chart and keep it ready whenever the user
    $scope.loadHistoricalChart = function() {

        var jsonTimeSeriesData = $scope.timeSeriesData['stockData'];
        var symbol = $scope.stockTickerSymbol;
        var timeSeriesData = jsonTimeSeriesData["Time Series (Daily)"];

        var src = "<a href=\"https://www.alphavantage.co/\" target=\"_blank\" style=\"color:blue; text-decoration:none;\">Source: Alpha Vantage</a>";
        var Datekeys = Object.keys(timeSeriesData);
        var processedDates = [];

        var priceArray = [];
        var millisecondsArray = [];

        console.log(Datekeys[0]);
        var index = 0;
        for (var date in Datekeys) {
            priceArray[index] = parseFloat(timeSeriesData[Datekeys[date]]['4. close']);

            var dateFormatObj = new Date(Datekeys[date]);
            var fulldate = new Date(dateFormatObj.getFullYear(), dateFormatObj.getMonth(), dateFormatObj.getDate());

            millisecondsArray[index] = fulldate.getTime();
            var tempDateObj = Datekeys[date].split('-');
            processedDates[index] = tempDateObj[1] + '/' + tempDateObj[2];
            index++;
        }

        var priceSeriesData = [];
        for (var n = processedDates.length - 1; n >= 0; n--) {
            priceSeriesData.push([millisecondsArray[n], priceArray[n]]);
        }

        Highcharts.stockChart('historicalChartsContainer', {
            rangeSelector: {
                selected: 1
            },

            title: {
                text: symbol + ' Stock Value'
            },

            subtitle: {
                useHTML: true,
                text: src
            },

            xAxis: {
                type: 'datetime'
            },


            series: [{
                name: symbol,
                data: priceSeriesData,
                tooltip: {
                    valueDecimals: 2
                }
            }]
        });
    }


    $scope.showIndicatorChart = function(indicatorVal, indicatorData) {

        var src = "<a href=\"https://www.alphavantage.co/\" target=\"_blank\" style=\"color:blue; text-decoration:none;\">Source: Alpha Vantage</a>";
        var symbol = $scope.stockTickerSymbol;
        var title = indicatorData['Meta Data']['2: Indicator'];

        var jsonObjKeys = Object.keys(indicatorData);
        var dateObj = indicatorData[jsonObjKeys[1]];

        var dateValues = [];
        dateValues = Object.keys(dateObj);
        var finalDates = [];

        var index = 0;
        for (var date in dateValues) {
            var date1 = dateValues[date].split('-');
            finalDates[index] = date1[1] + '/' + date1[2];
            index++;
        }

        if (title == "Commodity Channel Index (CCI)" || title == "Simple Moving Average (SMA)" ||
            title == "Relative Strength Index (RSI)" || title == "Exponential Moving Average (EMA)" ||
            title == "Average Directional Movement Index (ADX)") {
            var series = [];
            var index = 0;
            for (var i in dateObj) {
                for (var j in dateObj[i]) {
                    series[index] = parseFloat(dateObj[i][j]);
                    index++;
                }
            }

            var seriesData = [];
            for (var i = 0; i < finalDates.length; i++) {
                if (i < $scope.indicatorSize) {
                    seriesData.push([finalDates[i], series[i]]);
                }
            }

            Highcharts.chart('indicatorContainer', {

                title: {
                    text: title
                },

                subtitle: {
                    useHTML: true,
                    text: src
                },

                xAxis: {
                    categories: finalDates,
                    reversed: true,
                    tickInterval: 10,
                    labels: {
                        rotation: -45,
                        step: 1
                    }
                },

                yAxis: {
                    title: {
                        text: indicatorVal
                    }
                },


                plotOptions: {
                    series: {
                        marker: {
                            enabled: true,
                            symbol: 'circle',
                            radius: 1
                        },
                        label: {
                            connectorAllowed: false
                        },
                    }
                },


                series: [{
                    name: symbol,
                    data: seriesData,
                    lineWidth: 1.5
                }],
            });

        }

        if (title == "Stochastic (STOCH)") {
            var index = 0;
            var slowD = [],
                slowK = [];
            var seriesData1 = [],
                seriesData2 = [];
            for (var m in dateObj) {
                for (var n in dateObj[m]) {
                    if (n == "SlowD") { slowD[index] = parseFloat(dateObj[m][n]); var linkName1 = symbol + " SlowD"; }
                    if (n == "SlowK") { slowK[index] = parseFloat(dateObj[m][n]); var linkName2 = symbol + " SlowK"; }
                }
                index++;
            }

            for (var i = 0; i < finalDates.length; i++) {
                if (i < $scope.indicatorSize) {
                    seriesData1.push([finalDates[i], slowD[i]]);
                    seriesData2.push([finalDates[i], slowK[i]]);
                }
            }

            Highcharts.chart('indicatorContainer', {

                title: {
                    text: title
                },

                subtitle: {
                    useHTML: true,
                    text: src
                },

                xAxis: {
                    categories: finalDates,
                    reversed: true,
                    tickInterval: 10,
                    labels: {
                        rotation: -45,
                        step: 1
                    }
                },

                yAxis: {
                    title: {
                        text: indicatorVal
                    }
                },

                plotOptions: {
                    series: {
                        marker: {
                            enabled: true,
                            symbol: 'circle',
                            radius: 1
                        },
                        label: {
                            connectorAllowed: true
                        },
                    }
                },


                series: [{
                        name: linkName1,
                        data: seriesData1,
                        lineWidth: 1.5
                    },
                    {
                        name: linkName2,
                        data: seriesData2,
                        lineWidth: 1.5
                    }
                ],
            });
        }


        if (title == "Moving Average Convergence/Divergence (MACD)" || title == "Bollinger Bands (BBANDS)") {
            var index = 0;

            var seriesData1 = [],
                seriesData2 = [],
                seriesData3 = [];

            var RUB = [];
            var RMB = [];
            var RLB = [];
            for (var m in dateObj) {
                for (var n in dateObj[m]) {
                    if (n == "Real Middle Band" || n == "MACD_Hist") { RMB[index] = parseFloat(dateObj[m][n]); var linkName1 = symbol + " " + n; }
                    if (n == "Real Upper Band" || n == "MACD") { RUB[index] = parseFloat(dateObj[m][n]); var linkName2 = symbol + " " + n; }
                    if (n == "Real Lower Band" || n == "MACD_Signal") { RLB[index] = parseFloat(dateObj[m][n]); var linkName3 = symbol + " " + n; }
                }
                index++;
            }

            for (var i = 0; i < finalDates.length; i++) {
                if (i < $scope.indicatorSize) {
                    seriesData1.push([finalDates[i], RUB[i]]);
                    seriesData2.push([finalDates[i], RMB[i]]);
                    seriesData3.push([finalDates[i], RLB[i]]);
                }
            }


            Highcharts.chart('indicatorContainer', {

                title: {
                    text: title
                },

                subtitle: {
                    useHTML: true,
                    text: src
                },

                xAxis: {
                    categories: finalDates,
                    reversed: true,
                    tickInterval: 10,
                    labels: {
                        rotation: -45,
                        step: 1
                    }
                },

                yAxis: {
                    title: {
                        text: indicatorVal
                    }
                },

                plotOptions: {
                    series: {
                        marker: {
                            enabled: true,
                            symbol: 'circle',
                            radius: 1
                        },
                        label: {
                            connectorAllowed: true
                        }
                    }
                },


                series: [{
                        name: linkName1,
                        data: seriesData1,
                        lineWidth: 1.5
                    },
                    {
                        name: linkName2,
                        data: seriesData2,
                        lineWidth: 1.5
                    },
                    {
                        name: linkName3,
                        data: seriesData3,
                        lineWidth: 1.5
                    }
                ],
            });
        }
    }
}]);

app.service('stockService', function($http) {
    this.getStockPrice = function(symbolInput) {
        console.log("Inside getStockPriceService : " + symbolInput);

        // Create the request object
        var request = {
            method: 'GET',
            url: '/getStockDetails',
            params: { "stockSymbol": symbolInput }
        }
        return $http(request);
    }

    this.getIndicatorStocks = function(symbolInput, indicatorSymbol) {
        // Create the request object
        var request = {
            method: 'GET',
            url: '/getIndicatorValues',
            params: { "stockSymbol": symbolInput, "indicator": indicatorSymbol }
        }
        return $http(request);
    }

    this.getNewsFeed = function(symbolInput) {
        // Create the request object
        var request = {
            method: 'GET',
            url: '/getNewsFeed',
            params: { "stockSymbol": symbolInput }
        }
        return $http(request);
    }
});