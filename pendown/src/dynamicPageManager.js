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


// Assuming previous functionalities are kept, add the following:

/**
 * Function to toggle the display of the text editor for a page.
 * @param {string} pageId - The unique identifier for the page.
 */
function toggleTextEditor(pageId) {
    const editorId = `editor-${pageId}`;
    let editor = document.getElementById(editorId);
    if (!editor) {
        // Create a new editor if it doesn't exist
        editor = document.createElement('div');
        editor.id = editorId;
        editor.contentEditable = true;
        editor.className = 'text-editor';
        document.body.appendChild(editor);
        loadContentFromStorage(pageId, editor);
    }
    editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
}

/**
 * Load content from local storage into the editor.
 * @param {string} pageId - The unique identifier for the page.
 * @param {HTMLElement} editor - The editor element.
 */
function loadContentFromStorage(pageId, editor) {
    const pagesContent = JSON.parse(localStorage.getItem('pagesContent')) || {};
    editor.innerHTML = pagesContent[pageId] || '<p>Type here...</p>';
    // Save content on blur
    editor.onblur = function() {
        saveContentToStorage(pageId, editor.innerHTML);
    };
}

/**
 * Save the editor content to local storage.
 * @param {string} pageId - The unique identifier for the page.
 * @param {string} content - The HTML content of the editor.
 */
function saveContentToStorage(pageId, content) {
    const pagesContent = JSON.parse(localStorage.getItem('pagesContent')) || {};
    pagesContent[pageId] = content;
    localStorage.setItem('pagesContent', JSON.stringify(pagesContent));
}

// Modification to createPageItem to include an edit button
function createPageItem(pageName, pageId = Date.now().toString()) {
    // ...existing code
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'edit-btn';
    editButton.onclick = function() {
        toggleTextEditor(pageId);
    };
    pageItem.appendChild(editButton);
    // ...existing code to append the pageItem
    return pageId;
}
