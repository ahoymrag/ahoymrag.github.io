document.addEventListener('DOMContentLoaded', function() {
    loadPagesFromStorage();
    renderPagesTable();
});

document.getElementById('addPage').addEventListener('click', function() {
    const pageNameInput = document.getElementById('newPageName');
    const pageName = pageNameInput.value.trim();
    if (!pageName) {
        alert('Please enter a page name.');
        return;
    }
    const pageId = createPageItem(pageName);
    const editorContent = document.getElementById(`editor-${pageId}`)?.innerHTML || '';
    savePageToStorage(pageId, pageName, editorContent);
    pageNameInput.value = '';
});

function loadPagesFromStorage() {
    const pages = JSON.parse(localStorage.getItem('pages')) || {};
    Object.keys(pages).forEach(pageId => {
        createPageItem(pages[pageId].pageName, pageId);
    });
}

function savePageToStorage(pageId, pageName, content = '') {
    const pages = JSON.parse(localStorage.getItem('pages')) || {};
    pages[pageId] = { pageName, content };
    localStorage.setItem('pages', JSON.stringify(pages));
    renderPagesTable();
}

function createPageItem(pageName, pageId = Date.now().toString()) {
    const pagesContainer = document.getElementById('pagesContainer');
    const pageItem = document.createElement('div');
    pageItem.className = 'page-item';
    pageItem.id = `page-${pageId}`;
    pageItem.textContent = pageName;

    const editButton = createEditButton(pageId);
    const deleteButton = createDeleteButton(pageId);

    pageItem.appendChild(editButton);
    pageItem.appendChild(deleteButton);
    pagesContainer.appendChild(pageItem);

    return pageId;
}

function createEditButton(pageId) {
    const button = document.createElement('button');
    button.textContent = 'Edit';
    button.className = 'edit-btn';
    button.onclick = function() {
        toggleTextEditor(pageId);
    };
    return button;
}

function createDeleteButton(pageId) {
    const button = document.createElement('button');
    button.textContent = 'Delete';
    button.className = 'delete-btn';
    button.onclick = function() {
        document.getElementById(`page-${pageId}`).remove();
        removePageFromStorage(pageId);
    };
    return button;
}

function removePageFromStorage(pageId) {
    const pages = JSON.parse(localStorage.getItem('pages')) || {};
    delete pages[pageId];
    localStorage.setItem('pages', JSON.stringify(pages));
}

function toggleTextEditor(pageId) {
    let editor = document.getElementById(`editor-${pageId}`);
    if (!editor) {
        editor = createTextEditor(pageId);
    }
    editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
}

function createTextEditor(pageId) {
    const editor = document.createElement('div');
    editor.id = `editor-${pageId}`;
    editor.contentEditable = true;
    editor.className = 'text-editor';
    document.body.appendChild(editor);
    loadContentFromStorage(pageId, editor);
    return editor;
}

function loadContentFromStorage(pageId, editor) {
    const pagesContent = JSON.parse(localStorage.getItem('pagesContent')) || {};
    editor.innerHTML = pagesContent[pageId]?.content || '<p>Type here...</p>';
    editor.onblur = function() {
        saveContentToStorage(pageId, editor.innerHTML);
    };
}

function saveContentToStorage(pageId, content) {
    const pages = JSON.parse(localStorage.getItem('pages')) || {};
    if(pages[pageId]) {
        pages[pageId].content = content;
        localStorage.setItem('pages', JSON.stringify(pages));
    }
}

function renderPagesTable() {
    const pages = JSON.parse(localStorage.getItem('pages')) || {};
    const table = document.getElementById('pagesTable') || createPagesTable();
    
    table.innerHTML = '';

    Object.entries(pages).forEach(([pageId, { pageName }]) => {
        const row = table.insertRow();
        const nameCell = row.insertCell(0);
        const editCell = row.insertCell(1);
        
        nameCell.textContent = pageName;
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => toggleTextEditor(pageId));
        editCell.appendChild(editButton);
    });
}

function createPagesTable() {
    const container = document.getElementById('pagesContainer');
    const table = document.createElement('table');
    table.id = 'pagesTable';
    container.appendChild(table);
    return table;
}

function downloadAllPagesAsZip() {
    const zip = new JSZip();
    const pages = JSON.parse(localStorage.getItem('pages')) || {};

    Object.entries(pages).forEach(([pageId, { pageName, content }]) => {
        zip.file(`${pageName}.txt`, content || '');
    });

    zip.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, "allPages.zip");
    });
}

document.getElementById('globalSaveBtn')?.addEventListener('click', downloadAllPagesAsZip);
