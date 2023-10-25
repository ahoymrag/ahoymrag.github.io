// Fetch the JSON data
fetch('how2data.json')
  .then(response => response.json())
  .then(data => {
    // Loop through the array of instructions
    data.howToInstructions.forEach(instruction => {
      // Find the corresponding div by id
      const targetDiv = document.querySelector(`.${instruction.id}`);

      // If targetDiv exists, populate its content
      if (targetDiv) {
        // Find the header container within that div
        const headerContainer = targetDiv.querySelector('.how2header');

        // Find the description container within that div
        const descContainer = targetDiv.querySelector('.how2desc p');

        // Populate the header text
        if (headerContainer) {
          headerContainer.textContent = instruction.header;
        }

        // Populate the description text
        if (descContainer) {
          descContainer.textContent = instruction.description;
        }
      }
    });
  });
// Comment this block and uncomment fetch when fetching data from server
data.howToInstructions.forEach(instruction => {
	const targetDiv = document.querySelector(`.${instruction.id}`);
  
	if (targetDiv) {
	  const headerContainer = targetDiv.querySelector('.how2header');
	  const descContainer = targetDiv.querySelector('.how2desc');
  
	  if (headerContainer) {
		headerContainer.textContent = instruction.header;
	  }
  
	  if (descContainer) {
		let descriptionText = "";
		for (let section in instruction.description) {
		  descriptionText += `<strong>${section}:</strong><ul>`;
		  instruction.description[section].forEach(item => {
			descriptionText += `<li>${item}</li>`;
		  });
		  descriptionText += '</ul>';
		}
		descContainer.innerHTML = descriptionText;
	  }
	}
  });