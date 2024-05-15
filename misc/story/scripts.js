let currentSlide = 0;
let slides = [];

function loadSlides() {
    fetch('slides.json')
    .then(response => response.json())
    .then(data => {
        slides = data;
        showSlide(currentSlide);
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

document.addEventListener('DOMContentLoaded', loadSlides);
document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowRight') {
        changeSlide(1);
    } else if (event.key === 'ArrowLeft') {
        changeSlide(-1);
    }
});
