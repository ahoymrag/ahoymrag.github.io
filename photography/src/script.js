let currentPhotoIndex = 0;
let photos = [];

// Fetch photos from JSON
fetch('photos.json')
    .then(response => response.json())
    .then(data => {
        photos = data.photos;
        showPhoto(currentPhotoIndex);
    });

function startPortfolio() {
    document.getElementById('year-intro').style.display = 'none';
    document.getElementById('portfolio').classList.remove('hidden');
}

function showPhoto(index) {
    const photoContainer = document.getElementById('photo-container');
    photoContainer.style.backgroundImage = `url(${photos[index]})`;

    // Automatically transition to the next photo
    setTimeout(() => {
        currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
        showPhoto(currentPhotoIndex);
    }, 3000); // Change photo every 3 seconds
}