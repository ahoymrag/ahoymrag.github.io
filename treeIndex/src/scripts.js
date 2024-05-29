document.addEventListener('DOMContentLoaded', function() {
    fetch('trees.json')
        .then(response => response.json())
        .then(data => {
            const treeList = document.getElementById('treeList');
            const treeTypeSelect = document.getElementById('treeType');
            
            data.forEach(tree => {
                // Create tree card
                const treeCard = document.createElement('div');
                treeCard.classList.add('bg-white', 'shadow-md', 'rounded', 'p-4');
                
                // Tree image
                const treeImage = document.createElement('img');
                treeImage.src = tree.image;
                treeImage.alt = tree.name;
                treeImage.classList.add('w-full', 'h-48', 'object-cover', 'rounded-t');
                treeCard.appendChild(treeImage);
                
                // Tree name
                const treeName = document.createElement('h3');
                treeName.textContent = tree.name;
                treeName.classList.add('text-xl', 'font-bold', 'mt-2');
                treeCard.appendChild(treeName);
                
                // Tree scientific name
                const treeScientificName = document.createElement('p');
                treeScientificName.textContent = tree.scientific_name;
                treeScientificName.classList.add('italic', 'text-gray-600');
                treeCard.appendChild(treeScientificName);
                
                // Tree description
                const treeDescription = document.createElement('p');
                treeDescription.textContent = tree.description;
                treeDescription.classList.add('text-gray-700', 'mt-2');
                treeCard.appendChild(treeDescription);
                
                // Append tree card to tree list
                treeList.appendChild(treeCard);

                // Add tree option to select
                const treeOption = document.createElement('option');
                treeOption.value = tree.name;
                treeOption.textContent = tree.name;
                treeTypeSelect.appendChild(treeOption);
            });
        })
        .catch(error => console.error('Error fetching tree data:', error));
});

document.getElementById('purchaseForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const treeType = document.getElementById('treeType').value;
    const quantity = document.getElementById('quantity').value;

    alert(`You have purchased ${quantity} NFTs of ${treeType}`);
});
