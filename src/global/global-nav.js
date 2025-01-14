// Function to load Alpine.js if not already loaded
function loadAlpineJS() {
    if (!document.querySelector('script[src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js';
        script.defer = true;
        document.head.appendChild(script);
    }
}

// Create a script to add a global "back to home" button
document.addEventListener('DOMContentLoaded', function() {
    // Load Alpine.js
    loadAlpineJS();

    // Create the button element
    const button = document.createElement('div');
    button.setAttribute('x-data', '{ open: false }');
    button.setAttribute('x-on:click', 'open = !open');
    button.style.position = 'fixed';
    button.style.bottom = '10px';
    button.style.left = '10px';
    button.style.width = '16px';
    button.style.height = '16px';
    button.style.backgroundColor = '#333';
    button.style.borderRadius = '50%';
    button.style.cursor = 'pointer';
    button.style.zIndex = '1000';

    // Create the popup menu
    const menu = document.createElement('div');
    menu.setAttribute('x-show', 'open');
    menu.style.position = 'absolute';
    menu.style.bottom = '20px';
    menu.style.left = '0';
    menu.style.backgroundColor = '#fff';
    menu.style.border = '1px solid #ccc';
    menu.style.padding = '10px';
    menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    menu.style.zIndex = '1001';

    // Add links to the menu
    menu.innerHTML = `
        <a href="/" style="display: block; margin-bottom: 5px;">Home</a>
        <a href="/featured" style="display: block;">Featured</a>
    `;

    // Append the menu to the button
    button.appendChild(menu);

    // Append the button to the body
    document.body.appendChild(button);
});