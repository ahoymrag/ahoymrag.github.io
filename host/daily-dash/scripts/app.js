    function dashboardApp() {
      return {
        goals: [],
        newGoal: '',
        addGoal() {
          if (this.newGoal.trim()) {
            this.goals.push(this.newGoal.trim());
            this.newGoal = '';
          }
        },
        removeGoal(index) {
          this.goals.splice(index, 1);
        },
        async saveToCloud() {
          try {
            const response = await fetch(
              'https://storage.googleapis.com/YOUR_BUCKET_NAME/data.json',
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.goals),
              }
            );
            if (response.ok) {
              alert('Saved to cloud successfully!');
            } else {
              alert('Failed to save to cloud.');
            }
          } catch (error) {
            console.error(error);
            alert('Error saving to cloud.');
          }
        },
        async loadFromCloud() {
          try {
            const response = await fetch(
              'https://storage.googleapis.com/YOUR_BUCKET_NAME/data.json'
            );
            if (response.ok) {
              this.goals = await response.json();
              alert('Loaded from cloud successfully!');
            } else {
              alert('Failed to load from cloud.');
            }
          } catch (error) {
            console.error(error);
            alert('Error loading from cloud.');
          }
        },
      };
    }