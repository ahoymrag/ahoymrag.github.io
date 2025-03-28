"""
gui.py

PyQt GUI for Ahoy Indie Media (Desktop).
Displays a list of videos from JSON and plays them in a QVideoWidget.
"""

import os

from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QListWidget, QListWidgetItem,
    QLabel, QTabWidget, QLineEdit, QFrame
)
from PyQt6.QtCore import Qt

# ... existing code ...

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("Ahoy Indie Media - Desktop")
        self.setGeometry(100, 100, 1200, 800)  # Made window larger

        central_widget = QWidget(self)
        self.setCentralWidget(central_widget)
        
        # Main horizontal layout
        main_layout = QHBoxLayout(central_widget)
        
        # Add sidebar
        self.sidebar = self.create_sidebar()
        main_layout.addWidget(self.sidebar)
        
        # Center content
        center_content = QWidget()
        center_layout = QVBoxLayout(center_content)
        
        # Add search bar
        self.search_bar = QLineEdit()
        self.search_bar.setPlaceholderText("Search...")
        self.search_bar.textChanged.connect(self.on_search)
        center_layout.addWidget(self.search_bar)
        
        # Add tab widget to center content
        self.tab_widget = QTabWidget()
        center_layout.addWidget(self.tab_widget)
        
        main_layout.addWidget(center_content, stretch=2)
        
        # Add now playing section
        self.now_playing = self.create_now_playing()
        main_layout.addWidget(self.now_playing)

        # Video tab
        self.video_tab = QWidget()
        self.build_video_tab()
        self.tab_widget.addTab(self.video_tab, "Videos")

        # Music tab
        self.music_tab = QWidget()
        self.build_music_tab()
        self.tab_widget.addTab(self.music_tab, "Music")

    def create_sidebar(self):
        sidebar = QFrame()
        sidebar.setFrameStyle(QFrame.Shape.Box)
        sidebar.setMaximumWidth(200)
        
        layout = QVBoxLayout(sidebar)
        
        # Add sidebar items
        menu_items = ["Home", "Library", "Playlists", "Downloads", "Settings"]
        for item in menu_items:
            btn = FancyButton(item)
            layout.addWidget(btn)
            
        layout.addStretch()  # Pushes items to the top
        return sidebar

    def create_now_playing(self):
        now_playing = QFrame()
        now_playing.setFrameStyle(QFrame.Shape.Box)
        now_playing.setMaximumWidth(300)
        
        layout = QVBoxLayout(now_playing)
        
        # Now Playing header
        header = QLabel("Now Playing")
        header.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(header)
        
        # Current track info
        self.current_track = QLabel("No track selected")
        self.current_track.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.current_track)
        
        # Add mini player controls if needed
        controls = QHBoxLayout()
        prev_btn = FancyButton("⏮")
        play_btn = FancyButton("⏯")
        next_btn = FancyButton("⏭")
        
        controls.addWidget(prev_btn)
        controls.addWidget(play_btn)
        controls.addWidget(next_btn)
        
        layout.addLayout(controls)
        layout.addStretch()
        
        return now_playing

    def on_search(self, text):
        # Implement search functionality
        for i in range(self.video_list.count()):
            item = self.video_list.item(i)
            item.setHidden(text.lower() not in item.text().lower())

    # ... rest of existing code ... 