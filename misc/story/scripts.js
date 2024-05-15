let currentSlide = 0;
let slides = [];

function loadSlides() {
    fetch('slides.json')
    .then(response => response.json())
    .then(data => {
        slides = data;
        showSlide(currentSlide);
        displayAllSlides();
    });
}

function showSlide(n) {
    let slide = slides[n];
    document.getElementById('slideImage').src = slide.image;
    document.getElementById('slideText').textContent = slide.text;
}

function changeSlide(n) {
    currentSlide += n;
    if (currentSlide >= slides.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    showSlide(currentSlide);
}

function displayAllSlides() {
    const allSlidesContainer = document.getElementById('allSlides');
    slides.forEach(slide => {
        const slideElement = document.createElement('div');
        slideElement.className = 'slide';
        
        const imageElement = document.createElement('img');
        imageElement.src = slide.image;
        slideElement.appendChild(imageElement);
        
        const textElement = document.createElement('p');
        textElement.textContent = slide.text;
        slideElement.appendChild(textElement);
        
        allSlidesContainer.appendChild(slideElement);
    });
}

document.addEventListener('DOMContentLoaded', loadSlides);
document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowRight') {
        changeSlide(1);
    } else if (event.key === 'ArrowLeft') {
        changeSlide(-1);
    }
});
