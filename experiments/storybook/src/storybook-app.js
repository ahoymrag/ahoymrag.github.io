document.addEventListener('DOMContentLoaded', () => {
    const storybook = document.getElementById('storybook');
    const totalPages = 16 / 2; // Since you have 16 pages and show 2 pages per view
    let currentPage = 0;

    function renderPages() {
        storybook.innerHTML = ''; // Clear existing pages
        
        // Calculate which images to show based on currentPage
        const imageIndexStart = currentPage * 2;
        const imageIndexEnd = imageIndexStart + 1;

        // Add two pages per view, adjusting for the new naming convention and file format
        for (let i = imageIndexStart; i <= imageIndexEnd; i++) {
            const pageElement = document.createElement('div');
            pageElement.className = 'page';
            pageElement.innerHTML = `
                <img src="./src/assets/${i}_page.webp" alt="Page ${i + 1}" style="width: 100%; height: auto; aspect-ratio: 16 / 9;">
                <div class="caption">Caption for Page ${i + 1}</div>
            `;
            storybook.appendChild(pageElement);
        }
    }

    function turnPage(direction) {
        if (direction === 'next' && currentPage < totalPages - 1) {
            currentPage++;
        } else if (direction === 'prev' && currentPage > 0) {
            currentPage--;
        }
        renderPages();
    }

    // Initial render
    renderPages();

    // Navigation
    document.addEventListener('click', (e) => {
        const halfScreenWidth = window.innerWidth / 2;
        if (e.clientX > halfScreenWidth) {
            turnPage('next');
        } else {
            turnPage('prev');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const backgroundSound = document.getElementById('backgroundSound');
    backgroundSound.play();
    // Rest of the code...
});