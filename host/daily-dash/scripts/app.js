function dashboardApp() {
    return {
        currentTime: '',
        currentDate: '',
        newGoal: '',
        goals: [],
        startMenuOpen: false,
        dataTabOpen: false,
        programsOpen: false,
        utilitiesOpen: false,
        cloudStorage: ['Google Drive', 'Dropbox', 'OneDrive'],
        programs: [
            { name: 'Program 1', action: () => this.openProgram('Program 1') },
            { name: 'Program 2', action: () => this.openProgram('Program 2') }
        ],
        utilities: [
            { name: 'Utility 1', action: () => this.openUtility('Utility 1') },
            { name: 'Utility 2', action: () => this.openUtility('Utility 2') }
        ],

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
            // Implement program opening logic here
        },

        openUtility(utilityName) {
            console.log('Opening utility:', utilityName);
            // Implement utility opening logic here
        }
    };
}
