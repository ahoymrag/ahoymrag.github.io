// Connect to MongoDB using Mongoose
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/notesDB', { useNewUrlParser: true, useUnifiedTopology: true });

// Create a Note schema
const noteSchema = new mongoose.Schema({
  text: String
});

// Create a Note model
const Note = mongoose.model('Note', noteSchema);

// Define an array to store the notes
let notes = [];

// Function to add a new note
function addNote() {
  // Get the note input value
  const noteInput = document.getElementById('noteInput');
  const noteText = noteInput.value.trim();

  // Clear the input field
  noteInput.value = '';

  // Create a new Note instance
  const newNote = new Note({
    text: noteText
  });

  // Save the new note to the database
  newNote.save(function (err) {
    if (err) {
      console.error(err);
    } else {
      console.log('Note saved successfully.');
    }
  });

  // Add the note to the array
  notes.push(newNote);

  // Update the note list
  updateNoteList();
}

// Function to retrieve notes from the database
function getNotes() {
  // Clear the existing notes array
  notes = [];

  // Retrieve all notes from the database
  Note.find({}, function (err, foundNotes) {
    if (err) {
      console.error(err);
    } else {
      notes = foundNotes;
      updateNoteList();
    }
  });
}

// Function to update the note list
function updateNoteList() {
  // Get the note list element
  const noteList = document.getElementById('noteList');

  // Clear the existing note list
  noteList.innerHTML = '';

  // Iterate over the notes array and create note elements
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];

    // Create a new note element
    const noteElement = document.createElement('div');
    noteElement.className = 'note';
    noteElement.textContent = note.text;

    // Append the note element to the note list
    noteList.appendChild(noteElement);
  }
}

// Attach event listener to the form submission
const noteForm = document.getElementById('noteForm');
noteForm.addEventListener('submit', function (e) {
  e.preventDefault();
  addNote();
});

// Retrieve notes when the page loads
getNotes();
