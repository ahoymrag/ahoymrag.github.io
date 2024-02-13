// src/web3.js
import Web3 from 'web3';

let web3;

if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
        window.ethereum.enable().then(function() {
            // User has allowed account access to DApp...
        });
    } catch(e) {
        // User has denied account access to DApp...
    }
}
else if (window.web3) {
    web3 = new Web3(window.web3.currentProvider);
}
else {
    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
}

export default web3;
