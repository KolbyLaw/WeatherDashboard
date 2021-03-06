// Global Variables/Constants
const myApiKey = "d4e9b521bb7318f9f92d1d45d2fc7aa3";


// Pull Local Storage/Generate New Search History
var setupSearchHistory = function() {
    var searchHistory = JSON.parse(localStorage.getItem("searchHistory"));

    // Generate Base History if None
    if (searchHistory == null) {
        searchHistory = ["Salt Lake", "Denver", "Phoenix", "Boise", "Honolulu", "Nashville", "Austin", "Sacramento", "Tallahassee", "Albany"];
        localStorage.setItem("searchHistory",JSON.stringify(searchHistory));
    }

    var groupContainer = $(".list-group");
    groupContainer.html("");

    // Appending Items to History
    for (i in searchHistory) {
        var buttonEl = $("<button>")
            .addClass("list-group-item list-group-item-action")
            .attr("id", "citySearchList")
            .attr("type", "button")
            .text(searchHistory[i]);
        groupContainer.append(buttonEl);
    }
};


// Update/New Search History
var updateSearchHistory = function(city) {
    var searchHistory = JSON.parse(localStorage.getItem("searchHistory"));
    searchHistory.unshift(city);
    searchHistory.pop();
    localStorage.setItem("searchHistory",JSON.stringify(searchHistory));

    var listItems = $(".list-group-item");

    for (l in listItems) {
        listItems[l].textContent = searchHistory[l];
    };
}


// Main Weather Update Function
var updateWeather = function(response) {

    var currentTemp = response.main.temp;
    var currentHumidity = response.main.humidity;
    var currentWindSpeed = response.wind.speed;
    var currentTimeCodeUnix = response.dt;
    var currentDate = new Date(currentTimeCodeUnix*1000).toLocaleDateString("en-US");
    var currentIcon = response.weather[0].icon;
    
    var windSpeedEl = $("#currentWindSpeed");
    var dateEl = $("#currentDate");
    var tempEl = $("#currentTemp");
    var humidityEl = $("#currentHumidity");
    var iconEl = $("#currentIcon");
    
    // Update Page Values
    dateEl.text(currentDate);
    tempEl.text(currentTemp);
    humidityEl.text(currentHumidity);
    windSpeedEl.text(currentWindSpeed);
    iconEl.attr("src", "https://openweathermap.org/img/w/" + currentIcon + ".png");

    var currentTimeCodeUnix = response.dt;
    var s = new Date(currentTimeCodeUnix*1000).toLocaleDateString("en-US")

    var locationArr = {
        lat: response.coord.lat,
        long: response.coord.lon
    }
    
    return locationArr;
}; 


// NOTE PLACEHOLDER
var getIndex = function(response) {
    var idx = 0
    for (i=1;i<response.list.length;i++) {
        var currentTime = new Date(response.list[i].dt*1000);
        var lastTime = new Date(response.list[i-1].dt*1000);
        if (currentTime.getDay() != lastTime.getDay()) {
            if (i == 8) {
                idx = 0;
                return idx;
            } else {
                idx = i;
                return idx;
            };
        };
    };
};


// UV Index Value Update
var updateUVIndex = function(val) {
    var uvIndexEl = $("#currentUV");
    uvIndexEl.text(val);
    uvIndexEl.removeClass();

    // Set Background Color/Warning Indicator
    if (val < 3) {
        uvIndexEl.addClass("lowuv");
    } else if (val < 6) {
        uvIndexEl.addClass("moderateuv");
    } else if (val < 8) {
        uvIndexEl.addClass("highuv");
    } else if (val < 11) {
        uvIndexEl.addClass("veryhighuv");
    } else {
        uvIndexEl.addClass("extremeuv");
    };
};


// API/Fetch Function
var getCurrentWeather = function(cityName) {
    var apiUrl = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&units=imperial&appid=" + myApiKey;

    fetch(apiUrl).then(function(response) {
        if (response.ok) {
            response.json().then(function(response) {
                var cityContainerEl = $("#currentCity");
                cityContainerEl.text(cityName);
                updateSearchHistory(cityName);

                var location = updateWeather(response);
                getForecast(cityName);
                
                var apiUrlUV = "https://api.openweathermap.org/data/2.5/uvi?lat=" + location.lat  + "&lon=" + location.long + "&appid=" + myApiKey;
                return fetch(apiUrlUV);
            }).then(function(response) {
                response.json().then(function(response) {
                    updateUVIndex(response.value);
                });
            });
        } else {
            alert("City not recognized!");
        };
    }).catch(function(error) {
        alert("Unable to connect to servers!");
    })
};


// Upcoming Week Forecast Function
var getForecast = function(cityName) {

    var forecastContainerEl = $("#day-forecast");
    forecastContainerEl.html("");
    
    var apiUrl = "https://api.openweathermap.org/data/2.5/forecast?q=" + cityName + "&units=imperial&appid=" + myApiKey;

    fetch(apiUrl).then(function(response) {
        response.json().then(function(response) {
            var idx = getIndex(response);
    
            for (i=0;i<5;i++) {
                var actualIdx = i * 8 + idx + 4;
                if (actualIdx>39) {actualIdx = 39};
    
                var timeCodeUnix = response.list[actualIdx].dt;
                var time = new Date(timeCodeUnix*1000).toLocaleDateString("en-US");
                var icon = response.list[actualIdx].weather[0].icon;
                var temp = response.list[actualIdx].main.temp;
                var humidity = response.list[actualIdx].main.humidity;
    
                var cardEl = $("<div>").addClass("col-2 card bg-primary pt-2");
                var cardTitleEl = $("<h5>").addClass("card-title").text(time);
                var divEl = $("<div>").addClass("weather-icon");
                var cardIconEl = $("<img>").addClass("p-2").attr("src","https://openweathermap.org/img/w/" + icon + ".png");
                var cardTempEl = $("<p>").addClass("card-text").text("Temp: " + temp + " " + String.fromCharCode(176) + "F");
                var cardHumidityEl = $("<p>").addClass("card-text mb-2").text("Humidity: " + humidity + "%");
    
                cardEl.append(cardTitleEl);
                divEl.append(cardIconEl);
                cardEl.append(divEl);
                cardEl.append(cardTempEl);
                cardEl.append(cardHumidityEl);
                forecastContainerEl.append(cardEl);
            }
        });
    }).catch(function(error) {
        alert("Unable to connect to servers!");
    })
};


// Submit Function
var formSubmitHandler = function(event) {
    target = $(event.target);
    targetId = target.attr("id");

    if (targetId === "citySearchList") {
        var city = target.text();
    } else if (targetId === "search-submit") {
        var city = $("#searchCities").val();
    };

    if (city) {
        getCurrentWeather(city);
    } else {
        alert("Enter the city name!");
    }

    target.blur();
};


// Initial Function Calls
setupSearchHistory();
getCurrentWeather("New York");



$("button").click(formSubmitHandler);
$('#searchCities').keypress(function(event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
        var city = $("#searchCities").val();
        if (city) {
            getCurrentWeather(city);
        } else {
            alert("Enter the city name!");
        }
    }
});

