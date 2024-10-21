let currentPhotoIndex = 0;
let photos = [];

// Fetch photos from JSON
fetch('2024photos.json') // Ensure this path is correct relative to your HTML file
    .then(response => response.json())
    .then(data => {
        photos = data.photos;
        showGallery();
    });

function showGallery() {
    const galleryContainer = document.getElementById('gallery-container');
    galleryContainer.innerHTML = ''; // Clear existing photos

    // Display a grid of photos
    photos.forEach(photo => {
        const photoDiv = document.createElement('div');
        photoDiv.className = 'photo-item';
        photoDiv.style.backgroundImage = `url(${photo.url})`;
        galleryContainer.appendChild(photoDiv);
    });
}


