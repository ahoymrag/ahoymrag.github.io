document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
  // Cordova is now initialized. Have fun!
  loadProjects();
}

function loadProjects() {
  // Assume you have a "projects.json" file in the "www" directory
  fetch("projects.json")
    .then((response) => response.json())
    .then((projects) => {
      const projectContainer = document.getElementById("projects");
      projects.forEach((project) => {
        const projectDiv = document.createElement("div");
        projectDiv.className = "project";
        projectDiv.innerHTML = `
                    <h2 class="project-title">${project.name}</h2>
                    <p class="project-info">${project.description}</p>
                `;
        projectContainer.appendChild(projectDiv);
      });
    })
    .catch((error) => console.error("Error loading projects:", error));
}
