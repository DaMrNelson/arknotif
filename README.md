# Overview
A simple tool that lets you know when you are out of Lost Ark's queues. You can be notified via:
- Sound: the app will play a sound
- Discord webhook: get a message delivered to a Discord server
- SMS message: sign up for Trello and link your API key

# Running
Only windows is supported right now.
1. Download the package from the releases page.
2. Drag the app to your desktop and double-click it.
3. Grab yourself a snack. That was hard work!

# How does it work?
The script periodically takes a capture of the game window and checks if the Cancel button is still exactly the same as before.

This project was a speedrun. Please don't judge the UI or code too harshly, they have feelings too! I plan on eventually converting this to React + Django + Bootstrap once I have more a few more months of experience with those languages and am confident that I understand enough to produce something stable, but for now I'm sticking to ol' reliable and getting this out ASAP.
