import { createApp } from 'vue';
import App from './App.vue';
import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from './components/MainLayout.vue';
import Web3 from 'web3';

// Define routes
const routes = [
  { path: '/', component: MainLayout }, // Route for MainLayout
];

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Create Vue app
const app = createApp(App);

// Use router
app.use(router);

// Mount Vue app
app.mount('#app');

// Web3 integration
let web3;

if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    // Prompt user for account connections
    window.ethereum.request({ method: 'eth_requestAccounts' });
} else if (window.web3) {
    web3 = new Web3(window.web3.currentProvider);
} else {
    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
}

export default web3;