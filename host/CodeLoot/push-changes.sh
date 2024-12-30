#!/bin/bash

# Set variables
REPO_URL="https://github.com/yourusername/yourrepository.git"
CLONE_DIR="temp_repo"

# Function to check the status of the last command and exit if it failed
check_status() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

# Step 1: Check the remote repository URL
echo "Checking remote repository URL..."
git remote -v
check_status "Failed to check remote repository URL."

# Step 2: Increase the buffer size
echo "Increasing buffer size..."
git config http.postBuffer 524288000
check_status "Failed to increase buffer size."

# Step 3: Retry pushing changes
echo "Retrying push..."
git push
if [ $? -eq 0 ]; then
    echo "Push successful."
    exit 0
fi

# Step 4: Clone the repository to a new directory
echo "Cloning repository to a new directory..."
git clone $REPO_URL $CLONE_DIR
check_status "Failed to clone repository."

# Step 5: Copy changes to the new directory
echo "Copying changes to the new directory..."
cp -r * $CLONE_DIR/
check_status "Failed to copy changes."

# Step 6: Commit and push changes from the new directory
cd $CLONE_DIR
echo "Adding changes..."
git add .
check_status "Failed to add changes."

echo "Committing changes..."
git commit -m "Your commit message"
check_status "Failed to commit changes."

echo "Pushing changes..."
git push
check_status "Failed to push changes."

echo "Push successful."