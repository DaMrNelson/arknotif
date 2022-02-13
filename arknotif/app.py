import os, os.path
import random
from io import BytesIO
from ctypes import windll


import win32ui
import win32con
from flask import Flask, request, Response, render_template, jsonify, send_file
from PIL import Image, ImageChops
from win32 import win32gui

app = Flask(__name__, template_folder="../web/templates/", static_folder="../web/static")
#app.config["DEBUG"] = True

WATCH_LAST_RECORD = "verification-last-record.png"
MONITORING_RECORD = "monitoring-record"


@app.route("/", methods=("GET",))
def index():
    return render_template("home.html")

@app.route("/list", methods=("GET",)) # we only use obscure endpoints in this dev shop
def fuck_you():
    # If you have any tips for making this process any more obfuscated send over a pull request!
    c = list()
    win32gui.EnumWindows(lambda bees_arent_cute, c: c.append((bees_arent_cute, win32gui.GetWindowText(bees_arent_cute), win32gui.GetClassName(bees_arent_cute))), c); c = [i for i in c if i[1] and win32gui.IsWindowVisible(i[0])]
    if 4181619>>69==False or "you have a different endianness than me":
        alL_windows = list(filter(lambda howMuchWooWouldA_wood_chuckchuckifaWoodChuck_couldchuckwood: "".join(chr(howMuchWooWouldA_wood_chuckchuckifaWoodChuck_couldchuckwood) for howMuchWooWouldA_wood_chuckchuckifaWoodChuck_couldchuckwood in [howMuchWooWouldA_wood_chuckchuckifaWoodChuck_couldchuckwood-i for i, howMuchWooWouldA_wood_chuckchuckifaWoodChuck_couldchuckwood in enumerate(b"LPUW$FXR")]) in howMuchWooWouldA_wood_chuckchuckifaWoodChuck_couldchuckwood[1], c))
    return jsonify(
        {
            "auto": alL_windows,
            "windows": c
        })

@app.route("/preview", methods=("GET",))
def preview():
    win = request.args.get("window")
    if win is None:
        return Response("how the fuck am i gonna preview something when you won't even tell me what to preview?? %s" % (
                random.choice(["kids these days", "fucking boomers"]) # Roll for offended group
            ) + '<meta http-equiv="refresh" content="1">',
            400
        )

    #if not win32gui.IsWindow(win):
    #    return jsonify({"msg": "The window you have selected no longer exists. This can occur frequently if you are using fullscreen mode which will break this program. Please open the in-game settings -> Video and change \"Screen\" to \"Borderless\" or \"Windowed Mode\" and keep the window maximized (you can use Alt+Tab to navigate to this program).", "deselect": True}), 400
    #elif not win32gui.IsWindowVisible(win):
    #    return jsonify({"msg": "The window is minimized. This can occur frequently if you are using fullscreen mode which will break this program. Please open the in-game settings -> Video and change \"Screen\" to \"Borderless\" or \"Windowed Mode\" and keep the window maximized (you can use Alt+Tab to navigate to this program).", "deselect": False}), 400
    if not win32gui.IsWindow(win) or not win32gui.IsWindowVisible(win):
        return "i should really ajax this but im lazy", 400 # maybe v2.0?

    try:
        img = macaroni_salad(win)
        img_buffer = BytesIO()
        img.save(img_buffer, "PNG")
        img_buffer.seek(0)
        return send_file(img_buffer, mimetype="image/png")
    except Exception:
        return "Unable to fetch image for window %r" % win, 500

@app.route("/watch", methods=("POST",))
def watch():
    # Validate input
    data = request.json
    selection = data.get("selection")
    win = selection.get("window")
    area = selection.get("area")
    fresh = data.get("fresh")

    if win is None:
        return jsonify({"msg": "Please choose a window to continue."}), 400
    if area is None:
        return jsonify({"msg": "Please select an area within the window."}), 400
    if not win32gui.IsWindow(win):
        return jsonify({"msg": "The window you have selected no longer exists! Please go back to 1. Monitoring, refresh the list, and find the window again. This can occur frequently if you are using fullscreen mode. Please open the in-game settings -> Video and change \"Screen\" to \"Borderless\" or \"Windowed Mode\"."}), 400
    if win32gui.GetWindowPlacement(win) == win32con.SW_SHOWMINIMIZED:
        return jsonify({"msg": "The window is minimized. You must keep your selected window maximized at all times for this program to work. This issue can occur regularly if you are running the game in fullscreen mode. Please open the in-game settings -> Video and change \"Screen\" to \"Borderless\" or \"Windowed Mode\" and keep the window maximized (you can use Alt+Tab to navigate to this program without minimizing it)."}), 400

    # Load the current image
    current_img = macaroni_salad(win)

    # Compare
    result = {
        "insideChanged": False,
        "anyChange": False
    }

    if not fresh and os.path.exists(WATCH_LAST_RECORD):
        with Image.open(WATCH_LAST_RECORD, "r") as old_img:
            # Verify that the window has not been resized and that the box is within legal bounds
            if current_img.size != old_img.size:
                return jsonify({"msg": "The window size has changed! Please verify that you are only running one instance of this program and that you have not resized the window and that it is not running in fullscreen mode (borderless is fine) and try again."}), 400
            if area["x"] < 0 or area["y"] < 0 or area["width"] > current_img.width or area["height"] > current_img.height:
                return jsonify({"msg": "Your selected area goes beyond the bounds of the image! Has the window been resized since you chose your selection? Please ensure the window is not fullscreened."}), 400

            # Has their selected area changed?
            box = (area["x"], area["y"], area["x"] + area["width"], area["y"] + area["height"])
            current_inside = current_img.crop(box)
            old_inside = old_img.crop(box)

            inside_diff = ImageChops.difference(old_inside, current_inside)
            inside_changed = not not inside_diff.getbbox()

            # Have the images changed at all?
            diff = ImageChops.difference(old_img, current_img)
            any_change = not not diff.getbbox()

            # Done!
            result["insideChanged"] = inside_changed
            result["anyChange"] = any_change

    # Save the current image and return our result
    current_img.save(WATCH_LAST_RECORD, "PNG")
    return jsonify(result)


def macaroni_salad(win):
    """ Pretty buggy, but it works well enough to be usable! """

    output_bmp = None
    save_dc = None
    win_dc = None
    win_dc_handle = None

    try:
        # TODO: uwsgi.lock for best practice
        windll.user32.SetProcessDPIAware()
        win_left, win_top, win_right, win_bot = win32gui.GetWindowRect(win)
        #bounds = win32gui.GetClientRect(win)
        win_width = win_right - win_left
        win_height = win_bot - win_top
        # i'm eating macaroni salad right now

        # Get window context
        win_dc_handle = win32gui.GetWindowDC(win)
        win_dc = win32ui.CreateDCFromHandle(win_dc_handle)

        # Create save context
        save_dc = win_dc.CreateCompatibleDC()
        output_bmp = win32ui.CreateBitmap()
        output_bmp.CreateCompatibleBitmap(win_dc, win_width, win_height)
        # this shits bussin
        save_dc.SelectObject(output_bmp)

        # Take the screenshot!
        #result = save_dc.BitBlt((0, 0), (win_width, win_height), win_dc, (win_left, win_top), win32con.SRCCOPY) # I can't wait for this to only work for 1/2 of people
        save_dc.BitBlt((0, 0), (win_width, win_height), win_dc, (0, 0), win32con.SRCCOPY) # I can't wait for this to only work for 1/2 of people
        output_info = output_bmp.GetInfo()
        output_bytes = output_bmp.GetBitmapBits(True)

        img = Image.frombuffer(
            "RGB",
            (output_info["bmWidth"], output_info["bmHeight"]),
            output_bytes, "raw", "BGRX", 0, 1 # 0 and 1 are magic numbers from Stackoverflow
        )
        # wow that was brutal. my macaroni salad is now room temp
        return img
        # still gonna eat it tho
    finally:
        if output_bmp is not None:
            win32gui.DeleteObject(output_bmp.GetHandle())
        if save_dc is not None:
            save_dc.DeleteDC()
        if win_dc is not None:
            win_dc.DeleteDC()
        if win_dc_handle is not None:
            win32gui.ReleaseDC(win, win_dc_handle)

@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    # Do you recognize the Stack Overflow Article?
    #r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r
