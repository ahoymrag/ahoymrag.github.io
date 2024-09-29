document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
  setupTabs(); // Initialize the tabs functionality
}

function setupTabs() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", function () {
      const tabsContainer = document.querySelector("main");
      const activeTabButton = tabsContainer.querySelector(".tab-button.active");
      const activeTabContent = tabsContainer.querySelector(
        ".tab-content.active"
      );
      const tabToActivate = tabsContainer.querySelector(this.dataset.tabTarget);

      if (activeTabButton) activeTabButton.classList.remove("active");
      if (activeTabContent) activeTabContent.classList.remove("active");

      this.classList.add("active");
      tabToActivate.classList.add("active");
    });
  });
}
