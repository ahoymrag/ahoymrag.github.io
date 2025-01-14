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
        thoughts: '',
        feelings: 5,
        projectFocus: 1,
        mood: 'neutral',

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
                    this.thoughts = data.thoughts || '';
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

        updateMood() {
            if (this.feelings <= 3) {
                this.mood = 'stressed';
            } else if (this.feelings <= 7) {
                this.mood = 'neutral';
            } else {
                this.mood = 'happy';
            }
            document.body.className = this.mood;
        }
    };
}
