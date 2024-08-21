document.addEventListener('DOMContentLoaded', function() {
    const openOverlayBtn = document.getElementById('openOverlayBtn');
    const partialOverlay = document.getElementById('partialOverlay');

    openOverlayBtn.addEventListener('click', function() {
        partialOverlay.style.display = 'block';
    });

    partialOverlay.addEventListener('click', function(event) {
        if (event.target === partialOverlay) {
            partialOverlay.style.display = 'none';
        }
    });
});