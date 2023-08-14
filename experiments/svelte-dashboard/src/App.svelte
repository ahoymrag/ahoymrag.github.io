<script>
	import { slide, scale, fade, push, pull } from "svelte/transition";
  
	let currentTab = 'Dashboard';
</script>

<style>
	body {
		font-family: Arial, sans-serif;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 20px;
		background-color: #f4f4f4;
		border-bottom: 1px solid #e1e1e1;
	}

	.menu {
		display: flex;
		gap: 20px;
	}

	.menu a {
		text-decoration: none;
		color: black;
	}

	.menu a:hover {
		text-decoration: underline;
	}

	.dashboard {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding: 0 20px 20px;
	}

	.dashboard > button {
		padding: 20px;
		font-size: 20px;
		border: none;
		background-color: #333;
		color: #fff;
		cursor: pointer;
		border-radius: 8px;
		transition: 0.3s;
	}

	.dashboard > button:hover {
		background-color: #555;
	}

	.content {
		flex: 2;
		background-color: #f9f9f9;
		padding: 20px;
		text-align: center;
		overflow: hidden;
	}

	.tab {
		margin: auto;
		padding: 20px;
		background-color: #fff;
		border-radius: 8px;
		box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 800px;
		text-align: center;
	}
</style>

<header>
	<div>
		<img src="apple-logo.png" alt="Apple logo" width="40" height="40">
	</div>
	<nav class="menu">
		<a href="#" on:click={() => currentTab = 'Dashboard'}>Dashboard</a>
		<a href="#" on:click={() => currentTab = 'Settings'}>Settings</a>
		<a href="#" on:click={() => currentTab = 'Help'}>Help</a>
	</nav>
</header>

<main class="dashboard">
	<button on:click={() => currentTab = 'Dashboard'} transition:push={{delay: 200, dir: 1}}>Dashboard</button>
	<button on:click={() => currentTab = 'Settings'} transition:push={{delay: 200, dir: 1}}>Settings</button>
	<button on:click={() => currentTab = 'Help'} transition:push={{delay: 200, dir: 1}}>Help</button>
</main>

<div class="content" transition:pull={{delay: 300, dir: -1}}>
	{#if currentTab === 'Dashboard'}
		<div class="tab">
			<h3>Dashboard</h3>
			<p>Welcome to your dashboard. Here you can find a summary of your activities, notifications, and updates.</p>
		</div>
	{:else if currentTab === 'Settings'}
		<div class="tab">
			<h3>Settings</h3>
			<p>Manage your preferences, security settings, and personalize your dashboard experience.</p>
		</div>
	{:else}
		<div class="tab">
			<h3>Help</h3>
			<p>Need assistance? Browse our FAQs, watch tutorials, or contact our support team.</p>
		</div>
	{/if}
</div>
