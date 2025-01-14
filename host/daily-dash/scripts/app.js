function dashboardApp() {
    return {
        currentTime: '',
        currentDate: '',
        newGoal: '',
        goals: [],
        startMenuOpen: false,
        dataTabOpen: false,
        cloudStorage: ['Google Drive', 'Dropbox', 'OneDrive'],

        addGoal() {
            if (this.newGoal.trim()) {
                this.goals.push(this.newGoal.trim());
                this.newGoal = '';
                this.saveToCloud();
            }
        },

        removeGoal(index) {
            this.goals.splice(index, 1);
            this.saveToCloud();
        },

        async saveToCloud() {
            try {
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
                    alert('Failed to save to cloud.');
                } else {
                    alert('Goals saved to cloud successfully!');
                }
            } catch (error) {
                console.error('Error saving to cloud:', error);
                alert('Error saving to cloud.');
            }
        },

        async loadFromCloud() {
            try {
                const response = await fetch(
                    'https://storage.googleapis.com/ag-dash/data/data.json'
                );
                if (response.ok) {
                    const data = await response.json();
                    this.goals = data.goals || [];
                    alert('Goals loaded from cloud successfully!');
                } else {
                    console.error('Failed to load from cloud.');
                }
            } catch (error) {
                console.error('Error loading from cloud:', error);
                alert('Error loading from cloud.');
            }
        },
    };
}
