document.addEventListener('DOMContentLoaded', () => {
    fetch('ag-webs.json')
        .then(response => response.json())
        .then(data => {
            const websiteGrid = document.getElementById('website-grid');
            data.websites.forEach(website => {
                const websiteItem = createWebsiteItem(website);
                websiteGrid.appendChild(websiteItem);
            });
            setupPopup();
        })
        .catch(error => console.error('Error loading website data:', error));
});

function createWebsiteItem(website) {
    const item = document.createElement('div');
    item.className = 'website-item';
    item.setAttribute('data-id', website.id);
    item.innerHTML = `
        <img src="${website.thumbnail}" alt="${website.title}">
        <h2>${website.title}</h2>
        <p>${website.description}</p>
    `;
    return item;
}

function setupPopup() {
    const popup = document.getElementById('popup');
    const closeBtn = document.querySelector('.close');
    const websiteGrid = document.getElementById('website-grid');

    websiteGrid.addEventListener('click', (e) => {
        const websiteItem = e.target.closest('.website-item');
        if (websiteItem) {
            const websiteId = websiteItem.getAttribute('data-id');
            showPopup(websiteId);
        }
    });

    closeBtn.addEventListener('click', () => {
        popup.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.style.display = 'none';
        }
    });
}

function showPopup(websiteId) {
    fetch('ag-webs.json')
        .then(response => response.json())
        .then(data => {
            const website = data.websites.find(w => w.id === parseInt(websiteId));
            if (website) {
                document.getElementById('popup-title').textContent = website.title;
                document.getElementById('popup-description').textContent = website.description;
                document.getElementById('popup-link').href = website.link;
                document.getElementById('popup-year').textContent = website.yearMade;
                document.getElementById('popup-month').textContent = website.monthMade;
                document.getElementById('popup-professional').textContent = website.isProfessional ? 'Yes' : 'No';
                document.getElementById('popup-client').textContent = website.isForClient ? 'Yes' : 'No';
                document.getElementById('popup-client-name').textContent = website.clientName || 'N/A';

                const gallery = document.getElementById('popup-gallery');
                gallery.innerHTML = '';
                website.gallery.forEach(image => {
                    const img = document.createElement('img');
                    img.src = image;
                    img.alt = website.title;
                    gallery.appendChild(img);
                });

                const popup = document.getElementById('popup');
                popup.style.opacity = '0';
                popup.style.display = 'block';
                setTimeout(() => {
                    popup.style.opacity = '1';
                }, 10);
            }
        })
        .catch(error => console.error('Error loading website data:', error));
}