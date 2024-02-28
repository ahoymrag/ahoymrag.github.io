// Initialize or load pages from local storage
document.addEventListener('DOMContentLoaded', function() {
    loadPagesFromStorage();
});

// Add new page functionality
document.getElementById('addPage').addEventListener('click', function() {
    const pageNameInput = document.getElementById('newPageName');
    const pageName = pageNameInput.value.trim();
    if (!pageName) {
        alert('Please enter a page name.');
        return;
    }
    const pageId = createPageItem(pageName);
    savePageToStorage(pageId, pageName);
    pageNameInput.value = ''; // Clear input field
});

/**
 * Load pages from local storage and render them on the UI.
 */
function loadPagesFromStorage() {
    const pages = JSON.parse(localStorage.getItem('pages')) || {};
    Object.keys(pages).forEach(pageId => {
        createPageItem(pages[pageId], pageId);
    });
}

/**
 * Save a new page to local storage.
 * @param {string} pageId - The unique identifier for the page.
 * @param {string} pageName - The name of the page.
 */
function savePageToStorage(pageId, pageName) {
    const pages = JSON.parse(localStorage.getItem('pages')) || {};
    pages[pageId] = pageName;
    localStorage.setItem('pages', JSON.stringify(pages));
}

/**
 * Create a new page item and append it to the pages container.
 * @param {string} pageName - The name of the page to be added.
 * @param {string} [pageId] - Optional existing ID for the page.
 * @returns {string} The ID of the created page.
 */
function createPageItem(pageName, pageId = Date.now().toString()) {
    const pagesContainer = document.getElementById('pagesContainer');
    const pageItem = document.createElement('div');
    pageItem.className = 'page-item';
    pageItem.id = `page-${pageId}`;
    pageItem.textContent = pageName;

    // Add delete functionality
    const deleteButton = createDeleteButton(pageId);
    pageItem.appendChild(deleteButton);

    pagesContainer.appendChild(pageItem);
    return pageId;
}

/**
 * Create a delete button for each page item.
 * @param {string} pageId - The unique identifier for the page.
 * @returns {HTMLElement} The delete button element.
 */
function createDeleteButton(pageId) {
    const button = document.createElement('button');
    button.textContent = 'Delete';
    button.className = 'delete-btn';
    button.onclick = function() {
        document.getElementById(`page-${pageId}`).remove(); // Remove page element
        removePageFromStorage(pageId); // Remove page from storage
    };
    return button;
}

/**
 * Remove a page from local storage.
 * @param {string} pageId - The unique identifier for the page to be removed.
 */
function removePageFromStorage(pageId) {
    const pages = JSON.parse(localStorage.getItem('pages')) || {};
    delete pages[pageId];
    localStorage.setItem('pages', JSON.stringify(pages));
}
