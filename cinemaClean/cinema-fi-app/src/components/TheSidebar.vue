<template>
    <div class="sidebar">
      <div class="app-sidebar">
        <a href="" class="app-sidebar-link active">
          <i class="fas fa-home"></i> Home
        </a>
        <a href="" class="app-sidebar-link">
          <i class="fas fa-chart-pie"></i> Finances
        </a>
        <a href="" class="app-sidebar-link">
          <i class="fas fa-calendar-alt"></i> Calendar
        </a>
        <a href="" class="app-sidebar-link">
          <i class="fas fa-cog"></i> Settings
        </a>
        <a href="" class="app-sidebar-link">
            <i class="fas fa-cog"></i> Movies
          </a>
       <a href="" class="app-sidebar-link">
          <i class="fas fa-cog"></i> Market
        </a>
        <a href="" class="app-sidebar-link">
            <i class="fas fa-cog"></i> Fund
          </a>

     
      </div>
    </div>
</template>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 100px;
  height: 100vh;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-sidebar {
  width: 100%;
}

.app-sidebar-link {
  display: block;
  color: #333;
  text-decoration: none;
  padding: 10px;
  text-align: center;
  transition: background-color 0.3s ease;
}

.app-sidebar-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.app-sidebar-link i {
  margin-right: 8px;
}

.app-sidebar-link.active {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>