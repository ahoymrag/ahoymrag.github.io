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
        })
        .catch(error => {
            console.error('Error fetching batch data:', error);
            document.getElementById('batch-info').innerHTML = '<p>Error loading batch data. Please try again later.</p>';
        });
});