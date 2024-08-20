document.addEventListener('DOMContentLoaded', () => {
    fetch('batch-data.json')
        .then(response => response.json())
        .then(data => {
            const batchInfo = document.getElementById('batch-info');
            
            // Batch details
            batchInfo.innerHTML = `
                <h2>${data.batchName}</h2>
                <p>Batch Number: ${data.batchNumber}</p>
                <p>Date: ${data.date}</p>
                <p>Brew Time: ${data.brewTime}</p>
                <p>Amount Desired: ${data.amountDesired}</p>
                
                <h3>Media Gallery:</h3>
                <div class="media-gallery">
                    ${data.mediaGallery.map((image, index) => `
                        <div class="gallery-item">
                            <img src="${image}" alt="Batch image" class="gallery-image" onclick="openModal();currentSlide(${index + 1})">
                        </div>
                    `).join('')}
                </div>

                <div id="lightboxModal" class="modal">
                    <span class="close cursor" onclick="closeModal()">&times;</span>
                    <div class="modal-content">
                        ${data.mediaGallery.map((image, index) => `
                            <div class="mySlides">
                                <div class="numbertext">${index + 1} / ${data.mediaGallery.length}</div>
                                <img src="${image}" style="width:100%">
                            </div>
                        `).join('')}
                        
                        <a class="prev" onclick="plusSlides(-1)">&#10094;</a>
                        <a class="next" onclick="plusSlides(1)">&#10095;</a>
                    </div>
                </div>
                
                <h3>Ingredients:</h3>
                <ul>
                    ${data.ingredients.map(ingredient => `
                        <li class="ingredient">
                            <strong>${ingredient.name}</strong> (${ingredient.amount})
                            <br>Brand: ${ingredient.brand}
                            <br>Price: $${ingredient.price.toFixed(2)}
                            ${ingredient.description ? `<br>Description: ${ingredient.description}` : ''}
                            ${ingredient.ingredients ? `<br>Ingredients: ${ingredient.ingredients.join(', ')}` : ''}
                            ${ingredient.quantity ? `<br>Quantity: ${ingredient.quantity}` : ''}
                            ${ingredient.used ? `<br>Used: ${ingredient.used}` : ''}
                            <br>Restocked: ${ingredient.restocked ? 'Yes' : 'No'}
                        </li>
                    `).join('')}
                </ul>
                
                <h3>Process:</h3>
                ${data.process.map(step => `
                    <div class="process-step">
                        <h4>Step ${step.step}</h4>
                        <p>${step.description}</p>
                        ${step.image ? `<img src="${step.image}" alt="Step ${step.step}">` : ''}
                    </div>
                `).join('')}

                <h3>Notes for Next Time:</h3>
                <ul>
                    ${data.notesForNextTime.map(note => `<li>${note}</li>`).join('')}
                </ul>
            `;
            
            // Add lightbox functionality
            let slideIndex = 1;
            window.openModal = function() {
                document.getElementById("lightboxModal").style.display = "block";
            }
            
            window.closeModal = function() {
                document.getElementById("lightboxModal").style.display = "none";
            }
            
            window.plusSlides = function(n) {
                showSlides(slideIndex += n);
            }
            
            window.currentSlide = function(n) {
                showSlides(slideIndex = n);
            }
            
            function showSlides(n) {
                let i;
                let slides = document.getElementsByClassName("mySlides");
                if (n > slides.length) {slideIndex = 1}
                if (n < 1) {slideIndex = slides.length}
                for (i = 0; i < slides.length; i++) {
                    slides[i].style.display = "none";
                }
                slides[slideIndex-1].style.display = "block";
            }
        })
        .catch(error => {
            console.error('Error fetching batch data:', error);
            document.getElementById('batch-info').innerHTML = '<p>Error loading batch data. Please try again later.</p>';
        });
});