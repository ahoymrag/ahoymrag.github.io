document.addEventListener('DOMContentLoaded', function() {
    fetch('../sidebar-links.json') // Fetching the JSON file
        .then(response => response.json())
        .then(data => {
            const sidebar = document.querySelector('aside.active article');
            sidebar.innerHTML = ''; // Clear existing content
            data.links.forEach(link => {
                const button = document.createElement('button');
                button.textContent = link.text; // Set button text
                button.onclick = function() {
                    window.location.href = link.href; // Set button link
                };
                sidebar.appendChild(button); // Add button to sidebar
            });
            // Additional static content
            sidebar.appendChild(document.createElement('hr'));
            sidebar.appendChild(document.createElement('hr'));
            const header = document.createElement('h3');
            header.className = 'center';
            header.textContent = 'Demos of System';
            sidebar.appendChild(header);
        })
        .catch(error => console.error('Error loading the sidebar links:', error));
});