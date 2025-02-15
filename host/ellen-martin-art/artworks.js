fetch('artworks.json')
    .then(response => response.json())
    .then(data => {
        const mainSection = document.querySelector('main section');
        const filterForm = document.querySelector('#filter-system form');
        const modal = document.createElement('div');
        modal.classList.add('modal');
        document.body.appendChild(modal);

        const renderArtworks = (artworks) => {
            mainSection.innerHTML = ''; // Clear existing content
            artworks.forEach(artwork => {
                const article = document.createElement('article');
                article.innerHTML = `
                    <a href="#" class="artwork-link">
                        <figure>
                            <img src="${artwork.image}" alt="${artwork.title}">
                            <figcaption>${artwork.title} - Available for Sale</figcaption>
                        </figure>
                    </a>
                `;
                article.querySelector('.artwork-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    openModal(artwork);
                });
                mainSection.appendChild(article);
            });
        };

        const openModal = (artwork) => {
            const linksHtml = artwork.squareLinks.map(link => 
                `<a href="${link}" target="_blank" class="purchase-link">Purchase on Square</a>`
            ).join('<br>');

            modal.innerHTML = `
                <div class="modal-content">
                    <button class="close-btn">✕</button>
                    <img src="${artwork.image}" alt="${artwork.title}" class="modal-media">
                    <h2>${artwork.title}</h2>
                    <p>${artwork.forSale ? 'Available for Sale' : 'Not for Sale'}</p>
                    ${linksHtml}
                </div>
            `;
            modal.style.display = 'flex';
            modal.querySelector('.close-btn').addEventListener('click', closeModal);
        };

        const closeModal = () => {
            modal.style.display = 'none';
        };

        // Initial render of all artworks
        renderArtworks(data.artworks);

        // Filter artworks based on form input
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const artType = document.querySelector('#art-type').value;
            const season = document.querySelector('#season').value;

            const filteredArtworks = data.artworks.filter(artwork => {
                const matchesArtType = artType === 'all' || artwork.artType === artType;
                const matchesSeason = season === 'all' || artwork.season === season;
                return matchesArtType && matchesSeason;
            });

            renderArtworks(filteredArtworks);
        });
    })
    .catch(error => console.error('Error loading artwork data:', error));