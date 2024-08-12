  fetch('artworks.json')
            .then(response => response.json())
            .then(data => {
                const artGrid = document.getElementById('artGrid');
                data.artworks.forEach(artwork => {
                    const artItem = document.createElement('div');
                    artItem.className = 'art-item';
                    artItem.innerHTML = `
                        <img src="${artwork.image}" alt="${artwork.title}">
                        <h2>${artwork.title}</h2>
                        <p>Current Bid: $<span class="current-bid">${artwork.currentBid}</span></p>
                        <form class="bid-form">
                            <input type="number" placeholder="Enter your bid" min="${artwork.currentBid + 1}" step="1">
                            <button type="submit">Place Bid</button>
                        </form>
                    `;
                    artGrid.appendChild(artItem);
                });

                // Add event listeners to bid forms
                document.querySelectorAll('.bid-form').forEach(form => {
                    form.addEventListener('submit', function(e) {
                        e.preventDefault();
                        const bidInput = this.querySelector('input');
                        const currentBidSpan = this.parentElement.querySelector('.current-bid');
                        const newBid = parseInt(bidInput.value);
                        const currentBid = parseInt(currentBidSpan.textContent);

                        if (newBid > currentBid) {
                            currentBidSpan.textContent = newBid;
                            bidInput.min = newBid + 1;
                            bidInput.value = '';
                            alert('Your bid has been placed successfully!');
                        } else {
                            alert('Your bid must be higher than the current bid.');
                        }
                    });
                });
            })
            .catch(error => console.error('Error loading artwork data:', error));