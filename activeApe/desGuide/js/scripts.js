document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.querySelector('.navbar-toggler');
    const sidebar = document.querySelector('#sidebar');

    toggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const contentSections = document.querySelectorAll('.doc-content, main .h2, main p');

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();

        contentSections.forEach(section => {
            const text = section.textContent.toLowerCase();
            if (text.includes(query)) {
                section.style.display = 'block';
                highlightText(section, query);
            } else {
                section.style.display = 'none';
                removeHighlight(section);
            }
        });
    });
});

function highlightText(element, query) {
    const regex = new RegExp(query, 'gi');
    element.innerHTML = element.textContent.replace(regex, match => `<mark>${match}</mark>`);
}

function removeHighlight(element) {
    element.innerHTML = element.textContent;
}
