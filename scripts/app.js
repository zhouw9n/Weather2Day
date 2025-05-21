// --- Imports ---
import { weatherCodeMap } from "./weatherCodeMap.js";

// --- API calls ---

/**
 * Get the public IP address of the user.
 * @returns {Promise<string>} The public IP address as a string.
 * @throws Throws an error if the API request fails.
 */
async function getPublicIP() {
    const response = await fetch(`https://api.ipify.org/?format=json`);
    if (!response.ok) throw new Error("Failed to get IP address");
    const data = await response.json();
    return data.ip;
}

/**
 * Get geographical location from  IP address.
 * @param {string} ip - The public IP address.
 * @returns {Promise<Object>} Location data object.
 * @throws Throws an error if the API request fails.
 */
async function getLocationFromIP(ip) {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!response.ok) throw new Error(`Error: ${response.status}. Failed to get location.`);
    const data = await response.json();
    return data;
}

/**
 * Get current and forcast weather data for a given location.
 * @param {string} location - The location.
 * @returns {Promise<Object>} Weather data object.
 * @throws Throws an error if the API request fails.
 */
async function getWeather(location) {
    const response = await fetch(`https://weatherapi-wmse.onrender.com/api/weather/forecast?city=${encodeURIComponent(location)}`);
    if (!response.ok) throw new Error(`Error: ${response.status}. Failed to get weather.`);
    const data = await response.json(); 
    return data;
}

/**
 * Fetch location suggestions for a given search query from the user.
 * @param {string} query - The location.
 * @returns {Promise<Object[]>} Array of matching location objects.
 * @throws Throws an error if the API request fails.
 */
async function fetchLocationSuggestions(query) {
    const response = await fetch(`https://weatherapi-wmse.onrender.com/api/weather/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`${response.status}: Something went wrong.`);
    const data = await response.json();
    return data;
}

// --- Global variable ---

// Cache to store fetched weather data
const WEATHER_CACHE = new Map();

// Variable to store fetched current location from IP adddress
let CURRENT_LOCATION = ""; 

// UI state flags: true if the corresponding overlay (menu or search) is currently visible
let MENU_ACTIVE = false;
let SEARCH_ACTIVE = false;


window.onload = init();

async function init() {
        const query = await getCurrentLocation();
        await loadWeather(query);
        renderListUI();
}


document.addEventListener("click", (event) => {
    const menu = document.querySelector(".menu");
    const hamburgerIcon = document.querySelector(".hamburger-icon");
    if (MENU_ACTIVE && !menu.contains(event.target) && !hamburgerIcon.contains(event.target)) {
        closeMenu();
    }

    const searchBar = document.querySelector(".search-bar");
    const searchIcon = document.querySelector(".search-icon");
    const input = document.querySelector(".input");
    if (SEARCH_ACTIVE && !searchBar.contains(event.target) && !searchIcon.contains(event.target) && !input.contains(event.target)) {
        closeSearch();
    }
});

// Retrieve user's current location as a string "city country"
async function getCurrentLocation() {
    try {
        const ip = await getPublicIP();
        const locationData = await getLocationFromIP(ip);

        // Format and return the location as single string incase of same city name but different countries to hand it over as query parameter
        // e.g.,  "London Canada" vs. "London United Kingdom"
        const query = `${locationData.city} ${locationData.region} ${locationData.country_name}`;
        // Store location in global variable
        CURRENT_LOCATION = `${locationData.city} ${locationData.region} ${locationData.country_name}`;
        return query;
    } catch (error) {
        console.log(error);
    }
}

// Retrieve current weatehr data and store it in cache for UI
async function loadWeather(query) {
    let  location = "";
    try {
        const weatherData = await getWeather(query);
        location = weatherData.name;
        // Cache weather data for the given location to avoid repeated API calls
        WEATHER_CACHE.set(location, weatherData);
    } catch (error) {
        console.log(error);
    } finally {
        // Format weather data
        const displayData = formatWeatherDataForUI(location);
        // Render main UI
        renderUI(displayData);
        // Set event listeners for all buttons
        setupEventListnersMainUI();
    }
}

// Format raw data from weather cache and prepare for UI
function formatWeatherDataForUI(location) {
    // Get cached data based on location
    const cachedData = WEATHER_CACHE.get(location);

    // Weather data - current weather
    let city = cachedData.location.name;
    const country = cachedData.location.country;
    const tempC = Math.round(cachedData.current.temp_c);
    const tempF = Math.round(cachedData.current.temp_f);
    const windKph = Math.round(cachedData.current.wind_kph);
    const windMph = Math.round(cachedData.current.wind_mph);
    const windDegree = cachedData.current.wind_degree;
    const windDirection = getWindDirection(windDegree);
    const humidity = cachedData.current.humidity;
    const feelsLikeC = Math.round(cachedData.current.feelslike_c);
    const feelsLikeF = Math.round(cachedData.current.feelslike_f);
    const uvIndex = Math.round(cachedData.current.uv);
    const uvIndexLevel = getUvIndexLevel(uvIndex);
    const isDay = cachedData.current.is_day;
    const weatherCode = cachedData.current.condition.code;
    const sunriseTime =  cachedData.forecast.forecastday[0].astro.sunrise.slice(0,5);
    const sunsetTime =  cachedData.forecast.forecastday[0].astro.sunset.slice(0,5);

    // Show user "Your Location" if city is equal to current location
    if (city === CURRENT_LOCATION.split(" ")[0] && country === CURRENT_LOCATION.split(" ")[2]) {
        city = "Your Location";
    }

    let weatherCondition = "";
    let weatherIcon = "";
    // Get text and icon from mapping based on weather code and day of time
    if (isDay === 1) {
        const timeOfDay = "day"
        weatherCondition = weatherCodeMap[weatherCode]?.[timeOfDay].text;
        weatherIcon = weatherCodeMap[weatherCode]?.[timeOfDay].icon; 
    } else {
        const timeOfDay = "night";
        weatherCondition = weatherCodeMap[weatherCode]?.[timeOfDay].text;
        weatherIcon = weatherCodeMap[weatherCode]?.[timeOfDay].icon; 
    }

    // Weather data - forcast for today
    const tdyMaxTempC = Math.round(cachedData.forecast.forecastday[0].day.maxtemp_c);
    const tdyMaxTempF = Math.round(cachedData.forecast.forecastday[0].day.maxtemp_f);
    const tdyMinTempC = Math.round(cachedData.forecast.forecastday[0].day.mintemp_c);
    const tdyMinTempF = Math.round(cachedData.forecast.forecastday[0].day.mintemp_f);

    const tdyWeatherCode = cachedData.forecast.forecastday[0].day.condition.code;
    const tdyWeatherIcon = weatherCodeMap[tdyWeatherCode]?.["day"].icon;

    // Weather data - forcast for tomorrow
    const tmwrMaxTempC = Math.round(cachedData.forecast.forecastday[1].day.maxtemp_c);
    const tmwrMaxTempF = Math.round(cachedData.forecast.forecastday[1].day.maxtemp_f);
    const tmwrMinTempC = Math.round(cachedData.forecast.forecastday[1].day.mintemp_c);
    const tmwrMinTempF = Math.round(cachedData.forecast.forecastday[1].day.mintemp_c);

    const tmwrWeatherCode = cachedData.forecast.forecastday[1].day.condition.code;
    const tmwrWeatherIcon = weatherCodeMap[tmwrWeatherCode]?.["day"].icon;

    let date = cachedData.forecast.forecastday[1].date;
    const weekdayTmwr = getWeekday(date);

    // Weather data - forcast for after tommorow
    const aftrTmwrMaxTempC = Math.round(cachedData.forecast.forecastday[2].day.maxtemp_c);
    const aftrTmwrMaxTempF = Math.round(cachedData.forecast.forecastday[2].day.maxtemp_f);
    const aftrTmwrMinTempC = Math.round(cachedData.forecast.forecastday[2].day.mintemp_c);
    const aftrTmwrMinTempF = Math.round(cachedData.forecast.forecastday[2].day.mintemp_c);
    
    const aftrTmwrWeatherCode = cachedData.forecast.forecastday[2].day.condition.code;
    const aftrTmwrWeatherIcon = weatherCodeMap[aftrTmwrWeatherCode]?.["day"].icon;

    date = cachedData.forecast.forecastday[2].date;
    const weekdayAftrTmwr = getWeekday(date);

    return {
        //Return formated data
        city: city,
        tempC: tempC,
        tempF: tempF,
        windKph: windKph,
        windMph: windMph,
        windDirection: windDirection,
        humidity: humidity,
        feelsLikeC: feelsLikeC,
        feelsLikeF: feelsLikeF,
        uvIndex: uvIndex,
        uvIndexLevel: uvIndexLevel,
        weatherCondition: weatherCondition,
        weatherIcon: weatherIcon,
        sunriseTime: sunriseTime,
        sunsetTime: sunsetTime,
        tdyMaxTempC: tdyMaxTempC,
        tdyMaxTempF: tdyMaxTempF,
        tdyMinTempC: tdyMinTempC,
        tdyMinTempF: tdyMinTempF,
        tdyWeatherIcon: tdyWeatherIcon,
        weekdayTmwr: weekdayTmwr,
        tmwrMaxTempC: tmwrMaxTempC,
        tmwrMaxTempF: tmwrMaxTempF,
        tmwrMinTempC: tmwrMinTempC,
        tmwrMinTempF: tmwrMinTempF,
        tmwrWeatherIcon: tmwrWeatherIcon,
        weekdayAftrTmwr: weekdayAftrTmwr,
        aftrTmwrMaxTempC: aftrTmwrMaxTempC,
        aftrTmwrMaxTempF: aftrTmwrMaxTempF,
        aftrTmwrMinTempC: aftrTmwrMinTempC,
        aftrTmwrMinTempF: aftrTmwrMinTempF,
        aftrTmwrWeatherIcon: aftrTmwrWeatherIcon
    }
}

// Convert wind direction in degrees to a compass direction label.
function getWindDirection(windDegree) {
    if (windDegree >= 337.5 || windDegree < 22.5) return "North";
    if (windDegree >= 22.5 && windDegree < 67.5) return "Northeast";
    if (windDegree >= 67.5 && windDegree < 112.5) return "East";
    if (windDegree >= 112.5 && windDegree < 157.5) return "Southeast";
    if (windDegree >= 157.5 && windDegree < 202.5) return "South";
    if (windDegree >= 202.5 && windDegree < 247.5) return "Southwest";
    if (windDegree >= 247.5 && windDegree < 292.5) return "West";
    if (windDegree >= 292.5 && windDegree < 337.5) return "Northwest";
}

// Convert numerical UV index into a descriptive risk level based on WHO UV index scale.
function getUvIndexLevel(uvIndex) {
    if (uvIndex < 3) return "Low";
    if (uvIndex >= 3 && uvIndex < 6) return "Moderate";
    if (uvIndex >= 6 && uvIndex <8) return "High";
    if (uvIndex >= 8 && uvIndex < 11) return "Very High";
    return "Extreme";
}

// Convert date into weekday i.e. 2025-02-15 > Tuesday
function getWeekday(date) {
    const index = new Date(date).getDay();
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = weekdays[index];

    return day.slice(0,3);
}

function renderUI(displayData) {   
    const body = document.querySelector("body");
    body.innerHTML =
    `<nav class="navbar">
        <div title="Menu" class="hamburger-icon">
            <div class="line top"></div>
            <div class="line center"></div>
            <div class="line bottom"></div>
        </div>
        <h1 class="header-location">${displayData.city}</h1>
        <img title="Search" src="assets/menu-icons/search.svg" class="search-icon">
    </nav>

    <aside class="menu">
        <img title="Close Menu" src="assets/menu-icons/x-lg.svg" class="close-icon">
        <div class="list">
            <div class="tab active" data-location="Your Location">
                <p class="tab-location">Your Location</p>
            </div>
        </div>
        <footer class="footer">
            <p>Powered by <a href="https://www.weatherapi.com/" target="_blank" rel="noopener noreferrer">WeatherAPI</a></p>
        </footer>
    </aside>

    <aside class="search">
        <div class="container-search">
            <div class="icon-placeholder"></div>
            <div class="search-bar">
                <input type="text" placeholder="Search location..." id="search-input" class="input"></input>
            </div>
            <img title="Close Search" src="assets/menu-icons/x-lg.svg" class="close-icon-search">
        </div>
    </aside>

    <main>
        <div class="primary-panel">
            <div class="container-current-weather">
                <h2 class="value-today">Today</h2>
                <p class="value-current-condition">${displayData.weatherCondition}</p>
                <img class="icon-current-weather" src="assets/weather-icons/${displayData.weatherIcon}">
                <p class="value-current-temp">${displayData.tempC}°C</p>
            </div>

            <div class="container-forecast">
                <div class="tile">
                    <p class="value-day">Today</p>
                    <img class="value-icon" src="assets/weather-icons/${displayData.tdyWeatherIcon}">
                    <p class="value-temp-high">${displayData.tdyMaxTempC}°</p>
                    <p class="value-temp-low">${displayData.tdyMinTempC}°</p>
                </div>
                <div class="tile">
                    <p class="value-day">${displayData.weekdayTmwr}</p>
                    <img class="value-icon" src="assets/weather-icons/${displayData.tmwrWeatherIcon}">
                    <p class="value-temp-high">${displayData.tmwrMaxTempC}°</p>
                    <p class="value-temp-low">${displayData.tmwrMinTempC}°</p>
                </div>
                <div class="tile">
                    <p class="value-day">${displayData.weekdayAftrTmwr}</p>
                    <img class="value-icon" src="assets/weather-icons/${displayData.aftrTmwrWeatherIcon}">
                    <p class="value-temp-high">${displayData.aftrTmwrMaxTempC}°</p>
                    <p class="value-temp-low">${displayData.aftrTmwrMinTempC}°</p>
                </div>
            </div>
        </div>

        <div class="info-panel">
            <div class="container-weather-info">
                <div class="seperator-horizontal"></div>

                <div class="row">
                    <div class="tile-real-feel">
                        <p class="weather-info-title">Real feel</p>
                        <p class="weather-info-value">${displayData.feelsLikeC}°</p>
                    </div>
                    <div class="seperator-vertical"></div>
                    <div class="tile-humidity">
                        <p class="weather-info-title">Humidity</p>
                        <p class="weather-info-value">${displayData.humidity} %</p>
                    </div>
                </div>

                <div class="seperator-horizontal"></div>
                <div class="row">
                    <div class="tile-uv-index">
                        <p class="weather-info-title">UV index</p>
                        <p class="weather-info-value">${displayData.uvIndex}</p>
                        <p class="weather-info-additional">${displayData.uvIndexLevel}</p>
                    </div>
                    <div class="seperator-vertical"></div>
                    <div class="tile-wind">
                        <p class="weather-info-title">Wind</p>
                        <p class="weather-info-value">${displayData.windKph} kph</p>
                        <p class="weather-info-additional">${displayData.windDirection}</p>
                    </div>
                </div>

                <div class="seperator-horizontal"></div>

                <div class="row">
                    <div class="tile-sunrise">
                        <p class="weather-info-title">Sunrise</p>
                        <p class="weather-info-value">${displayData.sunriseTime}</p>
                        <p class="weather-info-additional">AM</p>
                    </div>
                    <div class="seperator-vertical invisible"></div>
                    <div class="tile-sunset">
                        <p class="weather-info-title">Sunset</p>
                        <p class="weather-info-value">${displayData.sunsetTime}</p>
                        <p class="weather-info-additional">PM</p>
                    </div>
                </div>

                <div class="seperator-horizontal"></div>
            </div>
        </div>
    </main>`
}

function setupEventListnersMainUI() {
    const menuButton = document.querySelector(".hamburger-icon");
    const closeMenuButton = document.querySelector(".close-icon");
    const searchButton = document.querySelector(".search-icon");
    const closeSearchButton = document.querySelector(".close-icon-search");
    const searchInput = document.querySelector(".input");
    

    menuButton.addEventListener("click", openMenu);
    closeMenuButton.addEventListener("click", closeMenu);
    searchButton.addEventListener("click", openSearch);
    closeSearchButton.addEventListener("click", closeSearch);
    searchInput.addEventListener("keyup", debounce(getSearchResult, 1000));
}

function openMenu() {
    const menu = document.querySelector(".menu");
    menu.classList.add("active");

    MENU_ACTIVE = true;
}

async function closeMenu() {
    const menu = document.querySelector(".menu.active");
    menu.classList.remove("active");
    
    MENU_ACTIVE = false;
}

// Open search overlay and prepares UI for user input
function openSearch() {
    const search = document.querySelector(".search");
    const containerSearch = document.querySelector(".container-search");
    search.classList.add("active");
    // Focus on input field for immediate typing
    containerSearch.classList.add("active");
    const input = document.querySelector(".input");
    input.focus();

    SEARCH_ACTIVE = true;
}

function closeSearch() {
    const search = document.querySelector(".search");
    const containerSearch = document.querySelector(".container-search");
    search.classList.remove("active");
    containerSearch.classList.remove("active");

    const input = document.querySelector(".input");
    input.value = "";
    removeResult();

    SEARCH_ACTIVE = false;
}

async function getSearchResult() {
    removeResult();

    const input = document.querySelector(".input");
    const query = replaceUmlaut(input.value);

    let suggestedLocations;
    const regex = /^[a-zA-Z,\-\s]+$/;
    if (query.length >= 4 && regex.test(query)) {
        suggestedLocations = await fetchLocationSuggestions(query);
    
        const filteredLocations = filterUniqueLocations(suggestedLocations);
    
        for (let i = filteredLocations.length - 1; i >= 0; i--) {
            const location = filteredLocations[i];

            renderSearchResult(location);
        }
    } else {
        // CODE NOT FOUND MESSAGE
    }    
}

function replaceUmlaut(str) {
    return str
    .replace(/ö/g, "o")
    .replace(/ä/g, "a")
    .replace(/ü/g, "u")
    .replace(/Ö/g, "O")
    .replace(/Ä/g, "A")
    .replace(/Ü/g, "U");
}

function filterUniqueLocations(suggestedLocations) {
    const locationCache = new Map();
    
    suggestedLocations.forEach((location) => {
        const key = `${location.name} ${location.region} ${location.country}`
        if (!locationCache.has(key)) {
            locationCache.set(key, location);
        }
    });

    return Array.from(locationCache.values());
}

function renderSearchResult(location) {
    const searchBar = document.querySelector(".search-bar");
    const newDiv = document.createElement("div");

    newDiv.classList.add("search-result");

    let suggestedLocation;
    if (location.region !== "") {
        suggestedLocation = `${location.name}, ${location.region}, ${location.country}`;
    } else {
        suggestedLocation = `${location.name}, ${location.country}`
    }
    newDiv.innerHTML = `<p>${suggestedLocation}</p>`;
    
    searchBar.appendChild(newDiv);
    
    newDiv.addEventListener("click", async() => {
        await closeSearch();
        await loadWeather(suggestedLocation);
        addToSavedLocations(suggestedLocation);
        

        renderListUI();
        setActiveTab(suggestedLocation);
        
    });
}

function removeResult() {
    const searchResult = document.getElementsByClassName("search-result");
    if (searchResult.length > 0) {
        Array.from(searchResult).forEach(result => {
            result.remove();
        });
    }
}

function addToSavedLocations(location) {
    const savedLocationList = JSON.parse(localStorage.getItem("savedLocations"));
    if (savedLocationList === null) {
        const list = [];
        list.push(location);
        localStorage.setItem("savedLocations", JSON.stringify(list));
        // Update list of locations on UI
    } else {
        const updatedList = [];

        savedLocationList.forEach((entry) => {
            updatedList.push(entry);
        });

        if (!updatedList.includes(location)) {
            updatedList.push(location);
        }
        // Overwrite old savedLocations in local storage with updated one
        localStorage.clear("savedLocations");
        localStorage.setItem("savedLocations", JSON.stringify(updatedList));
    }   
}

function removeFromSavedLocations(locationKey) {
    const savedLocationList = JSON.parse(localStorage.getItem("savedLocations"));
    const updatedList = [];
    savedLocationList.forEach((location) => {
        if (location !== locationKey) {
            updatedList.push(location);
        }
    });
    localStorage.setItem("savedLocations", JSON.stringify(updatedList));
}

function renderListUI() {
    const savedLocationList = JSON.parse(localStorage.getItem("savedLocations"));
    const locationList = Array.isArray(savedLocationList) ? savedLocationList : [];

    locationList.forEach((location) => {
        const list = document.querySelector(".list");
        // Handover parameter includes region and country i.e. London, Ontario, Canada
        const city = location.split(",")[0].trim();
        

        const newDiv = document.createElement("div");
        newDiv.classList.add("tab");
        newDiv.dataset.location = location;
        newDiv.innerHTML =
        `<p class="tab-location">${city}</p>
        <img title="Remove" src="assets/menu-icons/x-lg.svg" class="remove-icon">`
        list.appendChild(newDiv);

        setupEventListnersListUI();
    });
}

function setupEventListnersListUI() {
    const removeButton = document.querySelectorAll(".remove-icon");
    const tabs = document.querySelectorAll(".tab");
    // Remove location from list if user clicks on remove button
    removeButton.forEach((button) => {
        button.addEventListener("click", async() => {
            const parentDiv = button.parentNode;
            const locationKey = parentDiv.dataset.location;
            await closeMenu();
            removeFromSavedLocations(locationKey);
            init();
        });
    });

    // Switch tab if user changes location
    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const locationKey = tab.dataset.location;
            switchLocation(locationKey);
        });
    });
}

async function switchLocation(locationKey) {
    let query = locationKey === "Your Location" ? CURRENT_LOCATION : locationKey;
    
    try {
        await closeMenu();
        await loadWeather(query);
        renderListUI();
        setActiveTab(locationKey);
    } catch {

    }
}

function setActiveTab(locationKey) {
    const activeTab = document.querySelector(".tab.active");
    activeTab.classList.remove("active");
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
        if (tab.dataset.location === locationKey) {
            tab.classList.add("active");
        }
    });
}

function debounce(func, delay) {
    let timeoutId;
    return function () {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            func();
        },delay);
    }
}


