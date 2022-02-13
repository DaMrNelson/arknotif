# Overview
A simple tool that lets you know when you are out of Lost Ark's queues. You can be notified via:
- Sound: the app will play a sound
- Discord webhook: get a message delivered to a Discord server

This app works by periodically screenshotting the game window and checking if the leave queue button is still there.

# Running from Binaries
Only Windows is supported right now. **Please [submit a ticket](https://github.com/DaMrNelson/arknotif/issues/new) if the app is not working!** This is my first time releasing packaged software for Windows and I do not expect it to be without issue.
1. Download the package from the [releases page](https://github.com/DaMrNelson/arknotif/releases).
2. Drag the app to your desktop and double-click it.
3. Grab yourself a snack. That was hard work!

I haven't forked over $100 to become a trusted publisher so you may get warnings from Windows and your Antivirus when you try to launch the EXE. If you are concerned feel free to [check out the source](https://github.com/DaMrNelson/arknotif) code and build it yourself!

This app uses Microsoft Edge for its user interface. Please be aware that Edge may open when you run this app for the first time; you can just close it. If you have disabled Edge this app may not function properly. If you have experience packaging minimal Chromium builds for projects like this please reach out to me!

# Running from Source
Requires Python 3. Make sure you add Python to your PATH and open a new command prompt after installing!

```bat
:: Set up environment
python -m venv venv
source venv\scripts\activate
pip install -r requirements.txt

:: Run
python arknotifstartup.py

:: Build
build.bat
```
