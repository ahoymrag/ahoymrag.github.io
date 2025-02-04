// main.js

function appData() {
  return {
    // Navigation & UI states
    currentPage: 'home',
    newNote: '',
    notes: ['Sample Note 1', 'Sample Note 2'],
    newReminder: '',
    reminders: ['Sample Reminder 1', 'Sample Reminder 2'],
    serialStatus: 'Disconnected',
    port: null,
    reader: null,
    writer: null,
    
    // Facial expression states
    currentMood: 'neutral',
    expressions: {},
    
    // Speech recognition states
    recognition: null,
    speechTranscript: '',
    isListening: false,
    
    // Initialization: load expressions JSON, set up speech recognition, and track mouse movement
    init() {
      console.log('Engine Zuki Initialized');
      // Load facial expressions from the JSON file
      fetch('express.json')
        .then(response => response.json())
        .then(data => {
          this.expressions = data;
          this.updateFace();
        })
        .catch(error => console.error('Error loading expressions:', error));
      
      // Bind and set up mouse movement tracking for face following
      document.addEventListener('mousemove', this.trackMouse.bind(this));
      
      // Set up Speech Recognition if supported
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          this.speechTranscript = transcript;
        };
        this.recognition.onend = () => {
          this.isListening = false;
        };
      } else {
        console.warn("Speech Recognition not supported in this browser.");
      }
    },
    
    // Function to track mouse movement and update eye positions
    trackMouse(event) {
      const faceElem = document.getElementById('robotFace');
      if (!faceElem) return; // Ensure the element exists
      const faceRect = faceElem.getBoundingClientRect();
      const centerX = faceRect.left + faceRect.width / 2;
      const centerY = faceRect.top + faceRect.height / 2;
      const maxOffset = 10; // Maximum offset for the eyes
      
      // Calculate offset proportionally
      const offsetX = ((event.clientX - centerX) / faceRect.width) * maxOffset;
      const offsetY = ((event.clientY - centerY) / faceRect.height) * maxOffset;
      
      // Use the baseline positions from the current expression (or default values)
      let baseLeftX = 60;
      let baseLeftY = 60;
      let baseRightX = 140;
      let baseRightY = 60;
      if (this.expressions[this.currentMood]) {
        baseLeftX = this.expressions[this.currentMood].leftEye.cx;
        baseLeftY = this.expressions[this.currentMood].leftEye.cy;
        baseRightX = this.expressions[this.currentMood].rightEye.cx;
        baseRightY = this.expressions[this.currentMood].rightEye.cy;
      }
      
      const leftEye = document.getElementById('leftEye');
      const rightEye = document.getElementById('rightEye');
      
      if (leftEye) {
        leftEye.setAttribute('cx', baseLeftX + offsetX);
        leftEye.setAttribute('cy', baseLeftY + offsetY);
      }
      if (rightEye) {
        rightEye.setAttribute('cx', baseRightX + offsetX);
        rightEye.setAttribute('cy', baseRightY + offsetY);
      }
    },
    
    // Update the robot face based on the current mood
    updateFace() {
      const expression = this.expressions[this.currentMood];
      if (!expression) return;
      // Update left eye
      const leftEye = document.getElementById('leftEye');
      if (leftEye) {
        leftEye.setAttribute('cx', expression.leftEye.cx);
        leftEye.setAttribute('cy', expression.leftEye.cy);
        leftEye.setAttribute('r', expression.leftEye.r);
      }
      // Update right eye
      const rightEye = document.getElementById('rightEye');
      if (rightEye) {
        rightEye.setAttribute('cx', expression.rightEye.cx);
        rightEye.setAttribute('cy', expression.rightEye.cy);
        rightEye.setAttribute('r', expression.rightEye.r);
      }
      // Update mouth (the "d" attribute defines the SVG path)
      const mouth = document.getElementById('mouth');
      if (mouth) {
        mouth.setAttribute('d', expression.mouth.d);
      }
    },
    
    // Change the mood and update the face accordingly
    setMood(mood) {
      this.currentMood = mood;
      this.updateFace();
    },
    
    // Toggle speech recognition on and off
    toggleListening() {
      this.isListening = !this.isListening;
      if (this.recognition) {
        if (this.isListening) {
          this.recognition.start();
        } else {
          this.recognition.stop();
        }
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    },
    
    // Add a new note to the notes array
    addNote() {
      if (this.newNote.trim() !== '') {
        this.notes.push(this.newNote);
        this.newNote = '';
      }
    },
    
    // Add a new reminder to the reminders array
    addReminder() {
      if (this.newReminder.trim() !== '') {
        this.reminders.push(this.newReminder);
        this.newReminder = '';
      }
    },
    
    // Connect to Arduino using the Web Serial API
    async connectSerial() {
      this.serialStatus = 'Connected';
      if ("serial" in navigator) {
        try {
          // Request the serial port from the user
          this.port = await navigator.serial.requestPort();
          // Open the port at 9600 baud (ensure your Arduino uses the same baud rate)
          await this.port.open({ baudRate: 9600 });
          
          // Set up a writer for sending data
          this.writer = this.port.writable.getWriter();
          
          // Set up a reader to continuously read incoming data
          this.reader = this.port.readable.getReader();
          this.readLoop();
        } catch (error) {
          console.error('Error connecting to serial port:', error);
          this.serialStatus = 'Connection failed';
        }
      } else {
        this.serialStatus = 'Web Serial API not supported in this browser';
      }
    },
    
    // Continuously read data from the serial port
    async readLoop() {
      while (this.port && this.port.readable) {
        try {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value) {
            const text = new TextDecoder().decode(value);
            console.log('Received:', text);
          }
        } catch (error) {
          console.error('Error reading from serial port:', error);
          break;
        }
      }
    },
    
    // Send data via the serial port (if needed)
    async sendSerialData(data) {
      if (this.writer) {
        const encoder = new TextEncoder();
        await this.writer.write(encoder.encode(data));
      }
    },
    
    // Clear caches (for debugging purposes)
    clearCache() {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        }).then(() => {
          console.log('Cache cleared');
          alert('Cache cleared successfully!');
        }).catch(error => {
          console.error('Error clearing cache:', error);
          alert('Failed to clear cache.');
        });
      } else {
        alert('Cache API not supported in this browser.');
      }
    }
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});


const buddy = document.querySelector(".buddy svg");

// Only add the class if Buddy isn't sad
setInterval(() => {
  if (!document.querySelector("#sad:checked")) buddy.classList.add("wink");
}, 5000);

// Remove the wink class to reset the animation after it ends
buddy.addEventListener("animationend", () => {
  buddy.classList.remove("wink");
});
