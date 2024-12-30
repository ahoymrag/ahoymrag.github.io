   async function loadSidebar() {
            const response = await fetch('sidebarContent.json');
            const data = await response.json();

            const sidebar = document.getElementById('sidebar');
            let sidebarHTML = `
                <div class="component">
                    <div class="card">
                        <div class="panel">
                            <div class="item-block">
                                <div class="block-header">
                                    <button class="btn--default" onclick="location.href='index.html'">
                                        ${data.organization}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;

            data.menuItems.forEach(item => {
                sidebarHTML += `
                    <a href="${item.href}" class="menu-item">
                        <div class="icon">${item.icon}</div>
                        <span>${item.text}</span>
                    </a>`;
            });

            sidebarHTML += `<div class="bottom-section">`;
            data.bottomSection.forEach(item => {
                sidebarHTML += `
                    <a href="${item.href}" class="menu-item">
                        <div class="icon">${item.icon}</div>
                        <span>${item.text}</span>
                    </a>`;
            });
            sidebarHTML += `</div>`;

            sidebar.innerHTML = sidebarHTML;
        }

        loadSidebar();