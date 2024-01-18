document.querySelectorAll('.lightbox-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('lightbox-img').src = this.href;
        document.getElementById('lightbox').style.display = 'flex';
    });
});

document.getElementById('lightbox').addEventListener('click', function() {
    this.style.display = 'none';
});