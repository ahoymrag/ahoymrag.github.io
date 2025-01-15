function dashboardApp() {
    return {
        currentTime: '',
        currentDate: '',
        currentDay: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        newGoal: '',
        goals: [],
        startMenuOpen: false,
        dataTabOpen: false,
        programsOpen: false,
        utilitiesOpen: false,
        homeAutomationOpen: false,
        cloudStorage: ['Google Drive', 'Dropbox', 'OneDrive'],
        programs: [
            { name: 'Program 1', action: () => this.openProgram('Program 1') },
            { name: 'Program 2', action: () => this.openProgram('Program 2') }
        ],
        utilities: [
            { name: 'Utility 1', action: () => this.openUtility('Utility 1') },
            { name: 'Utility 2', action: () => this.openUtility('Utility 2') }
        ],
        homeAutomations: [
            { name: 'Automation 1', action: () => this.openAutomation('Automation 1') },
            { name: 'Automation 2', action: () => this.openAutomation('Automation 2') }
        ],
        thoughts: [],
        feelings: 5,
        tasksToAccomplish: 5,
        projectFocus: 1,
        dreamsVisionFocus: 1,
        relationshipsFocus: 1,
        focusLegend: '',
        moodColor: '#ffffff',
        newThought: '',
        currentThoughtIndex: 0,
        researchEntries: [],
        newResearchEntry: '',
        currentResearchIndex: 0,
        cryptoTickers: ['BTC', 'ETH'],
        cryptoPrices: {},

        addGoal() {
            if (this.newGoal.trim()) {
                this.goals.push(this.newGoal.trim());
                this.newGoal = '';
                console.log('Goal added:', this.goals);
                this.saveToCloud();
            }
        },

        removeGoal(index) {
            console.log('Removing goal at index:', index);
            this.goals.splice(index, 1);
            console.log('Goals after removal:', this.goals);
            this.saveToCloud();
        },

        async saveToCloud() {
            try {
                console.log('Saving goals to cloud:', this.goals);
                const response = await fetch(
                    'https://storage.googleapis.com/ag-dash/data/data.json',
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ goals: this.goals }),
                    }
                );
                if (!response.ok) {
                    console.error('Failed to save to cloud:', response.status, response.statusText);
                    alert('Failed to save to cloud.');
                } else {
                    console.log('Goals successfully saved to cloud.');
                    alert('Saved to cloud successfully!');
                }
            } catch (error) {
                console.error('Error saving to cloud:', error);
                alert('Error saving to cloud: ' + error.message);
            }
        },

        async loadFromCloud() {
            try {
                console.log('Loading goals from cloud...');
                const response = await fetch(
                    'https://storage.googleapis.com/ag-dash/data/data.json'
                );
                if (response.ok) {
                    const data = await response.json();
                    console.log('Data loaded from cloud:', data);
                    this.goals = data.goals || [];
                    alert('Goals loaded from cloud successfully!');
                } else {
                    console.error('Failed to load from cloud:', response.status, response.statusText);
                    alert('Failed to load from cloud.');
                }
            } catch (error) {
                console.error('Error loading from cloud:', error);
                alert('Error loading from cloud: ' + error.message);
            }
        },

        openProgram(programName) {
            console.log('Opening program:', programName);
            if (programName === 'Pecan Research') {
                this.loadCryptoPrices();
            }
            // Implement program opening logic here
        },

        openUtility(utilityName) {
            console.log('Opening utility:', utilityName);
            // Implement utility opening logic here
        },

        async saveThoughtsToCloud() {
            try {
                console.log('Saving thoughts to cloud:', this.thoughts);
                const response = await fetch(
                    'https://storage.googleapis.com/ag-dash/data/thoughts.json',
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ thoughts: this.thoughts }),
                    }
                );
                if (!response.ok) {
                    console.error('Failed to save thoughts to cloud:', response.status, response.statusText);
                    alert('Failed to save thoughts to cloud.');
                } else {
                    console.log('Thoughts successfully saved to cloud.');
                    alert('Thoughts saved to cloud successfully!');
                }
            } catch (error) {
                console.error('Error saving thoughts to cloud:', error);
                alert('Error saving thoughts to cloud: ' + error.message);
            }
        },

        async loadThoughtsFromCloud() {
            try {
                console.log('Loading thoughts from cloud...');
                const response = await fetch(
                    'https://storage.googleapis.com/ag-dash/data/thoughts.json'
                );
                if (response.ok) {
                    const data = await response.json();
                    console.log('Thoughts loaded from cloud:', data);
                    this.thoughts = data.thoughts || [];
                    alert('Thoughts loaded from cloud successfully!');
                } else {
                    console.error('Failed to load thoughts from cloud:', response.status, response.statusText);
                    alert('Failed to load thoughts from cloud.');
                }
            } catch (error) {
                console.error('Error loading thoughts from cloud:', error);
                alert('Error loading thoughts from cloud: ' + error.message);
            }
        },

        async saveFeelingsToCloud() {
            try {
                console.log('Saving feelings to cloud:', this.feelings);
                const response = await fetch(
                    'https://storage.googleapis.com/ag-dash/data/feelings.json',
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ feelings: this.feelings }),
                    }
                );
                if (!response.ok) {
                    console.error('Failed to save feelings to cloud:', response.status, response.statusText);
                    alert('Failed to save feelings to cloud.');
                } else {
                    console.log('Feelings successfully saved to cloud.');
                    alert('Feelings saved to cloud successfully!');
                }
            } catch (error) {
                console.error('Error saving feelings to cloud:', error);
                alert('Error saving feelings to cloud: ' + error.message);
            }
        },

        async loadFeelingsFromCloud() {
            try {
                console.log('Loading feelings from cloud...');
                const response = await fetch(
                    'https://storage.googleapis.com/ag-dash/data/feelings.json'
                );
                if (response.ok) {
                    const data = await response.json();
                    console.log('Feelings loaded from cloud:', data);
                    this.feelings = data.feelings || 5;
                    alert('Feelings loaded from cloud successfully!');
                } else {
                    console.error('Failed to load feelings from cloud:', response.status, response.statusText);
                    alert('Failed to load feelings from cloud.');
                }
            } catch (error) {
                console.error('Error loading feelings from cloud:', error);
                alert('Error loading feelings from cloud: ' + error.message);
            }
        },

        async saveProjectFocusToCloud() {
            try {
                console.log('Saving project focus to cloud:', this.projectFocus);
                const response = await fetch(
                    'https://storage.googleapis.com/ag-dash/data/projectFocus.json',
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ projectFocus: this.projectFocus }),
                    }
                );
                if (!response.ok) {
                    console.error('Failed to save project focus to cloud:', response.status, response.statusText);
                    alert('Failed to save project focus to cloud.');
                } else {
                    console.log('Project focus successfully saved to cloud.');
                    alert('Project focus saved to cloud successfully!');
                }
            } catch (error) {
                console.error('Error saving project focus to cloud:', error);
                alert('Error saving project focus to cloud: ' + error.message);
            }
        },

        async loadProjectFocusFromCloud() {
            try {
                console.log('Loading project focus from cloud...');
                const response = await fetch(
                    'https://storage.googleapis.com/ag-dash/data/projectFocus.json'
                );
                if (response.ok) {
                    const data = await response.json();
                    console.log('Project focus loaded from cloud:', data);
                    this.projectFocus = data.projectFocus || 1;
                    alert('Project focus loaded from cloud successfully!');
                } else {
                    console.error('Failed to load project focus from cloud:', response.status, response.statusText);
                    alert('Failed to load project focus from cloud.');
                }
            } catch (error) {
                console.error('Error loading project focus from cloud:', error);
                alert('Error loading project focus from cloud: ' + error.message);
            }
        },

        addThought() {
            if (this.newThought.trim()) {
                this.thoughts.push({
                    text: this.newThought.trim(),
                    timestamp: new Date().toLocaleString()
                });
                this.newThought = '';
                console.log('Thought added:', this.thoughts);
                this.saveThoughtsToCloud();
            }
        },

        updateCurrentThought() {
            const thought = this.thoughts[this.currentThoughtIndex];
            if (thought) {
                console.log('Current thought:', thought);
            }
        },

        addResearchEntry() {
            if (this.newResearchEntry.trim()) {
                this.researchEntries.push({
                    text: this.newResearchEntry.trim(),
                    timestamp: new Date().toLocaleString()
                });
                this.newResearchEntry = '';
                console.log('Research entry added:', this.researchEntries);
                this.saveResearchToCloud();
            }
        },

        async saveResearchToCloud() {
            try {
                console.log('Saving research entries to cloud:', this.researchEntries);
                const response = await fetch(
                    'https://storage.googleapis.com/ag-dash/data/research.json',
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ researchEntries: this.researchEntries }),
                    }
                );
                if (!response.ok) {
                    console.error('Failed to save research to cloud:', response.status, response.statusText);
                    alert('Failed to save research to cloud.');
                } else {
                    console.log('Research entries successfully saved to cloud.');
                    alert('Research saved to cloud successfully!');
                }
            } catch (error) {
                console.error('Error saving research to cloud:', error);
                alert('Error saving research to cloud: ' + error.message);
            }
        },

        async loadResearchFromCloud() {
            try {
                console.log('Loading research entries from cloud...');
                const response = await fetch(
                    'https://storage.googleapis.com/ag-dash/data/research.json'
                );
                if (response.ok) {
                    const data = await response.json();
                    console.log('Research entries loaded from cloud:', data);
                    this.researchEntries = data.researchEntries || [];
                    alert('Research entries loaded from cloud successfully!');
                } else {
                    console.error('Failed to load research from cloud:', response.status, response.statusText);
                    alert('Failed to load research from cloud.');
                }
            } catch (error) {
                console.error('Error loading research from cloud:', error);
                alert('Error loading research from cloud: ' + error.message);
            }
        },

        updateCurrentResearch() {
            const research = this.researchEntries[this.currentResearchIndex];
            if (research) {
                console.log('Current research entry:', research);
            }
        },

        async loadCryptoPrices() {
            try {
                console.log('Loading crypto prices...');
                // Example API call to fetch crypto prices
                const response = await fetch('https://api.example.com/crypto-prices', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ tickers: this.cryptoTickers }),
                });
                if (response.ok) {
                    const data = await response.json();
                    this.cryptoPrices = data.prices;
                    console.log('Crypto prices loaded:', this.cryptoPrices);
                } else {
                    console.error('Failed to load crypto prices:', response.status, response.statusText);
                    alert('Failed to load crypto prices.');
                }
            } catch (error) {
                console.error('Error loading crypto prices:', error);
                alert('Error loading crypto prices: ' + error.message);
            }
        },

        updateMoodColor() {
            document.documentElement.style.setProperty('--mood-color', this.moodColor);
            document.documentElement.style.setProperty('--button-background-color', this.moodColor);
            document.documentElement.style.setProperty('--button-border-color', this.moodColor);
            // You can add more properties if needed
        },
    };
}
