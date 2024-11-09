let map;
let journeyPath;
let watchId;

function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            map = new google.maps.Map(document.getElementById('map'), {
                center: pos, // Center map on current location
                zoom: 15 // Adjust zoom level as needed
            });

            journeyPath = new google.maps.Polyline({
                path: [],
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });

            journeyPath.setMap(map);
        }, error => {
            console.error('Error occurred. Error code: ' + error.code);
            // Fallback to a default location if geolocation fails
            map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: -34.397, lng: 150.644 }, // Default center
                zoom: 8
            });
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
        // Fallback to a default location if geolocation is not supported
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: -34.397, lng: 150.644 }, // Default center
            zoom: 8
        });
    }
}

function startJourney() {
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(position => {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            map.setCenter(pos);
            journeyPath.getPath().push(new google.maps.LatLng(pos.lat, pos.lng));
        }, error => {
            console.error('Error occurred. Error code: ' + error.code);
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
    }
}

function stopJourney() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');
    initMap(); // Initialize the map when the device is ready
}
