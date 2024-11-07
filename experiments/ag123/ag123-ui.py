import tkinter as tk
from threading import Thread
from silverback import SilverbackBot

# Assuming your bot is initialized in a module named 'your_bot_module'
from ag123 import bot  # Import your bot module

class BotGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("AG123 Bot GUI")

        # Start Button
        self.start_button = tk.Button(root, text="Start AG123", command=self.start_bot)
        self.start_button.pack()

        # Stop Button
        self.stop_button = tk.Button(root, text="Stop AG123", command=self.stop_bot)
        self.stop_button.pack()

        # Log Area
        self.log_area = tk.Text(root, height=20, width=50)
        self.log_area.pack()

    def start_bot(self):
        self.log_area.insert(tk.END, "Starting AG123 bot...\n")
        self.bot_thread = Thread(target=self.run_bot)
        self.bot_thread.start()

    def stop_bot(self):
        self.log_area.insert(tk.END, "Stopping AG123 bot...\n")
        # Implement bot stop logic here, if supported by SilverbackBot

    def run_bot(self):
        # Start the bot's main loop or tasks
        try:
            bot.run()  # Assuming your bot has a run method
            self.log_message("AG123 bot is running.")
        except Exception as e:
            self.log_message(f"Error: {e}")

    def log_message(self, message):
        self.log_area.insert(tk.END, message + "\n")

if __name__ == "__main__":
    root = tk.Tk()
    gui = BotGUI(root)
    root.mainloop()