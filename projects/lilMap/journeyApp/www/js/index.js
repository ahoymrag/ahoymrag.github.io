

let map;
let journeyPath;
let watchId;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 }, // Default center
        zoom: 8
    });

    journeyPath = new google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    journeyPath.setMap(map);
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
