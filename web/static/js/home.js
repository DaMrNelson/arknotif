var $windowList;
var $preview;
var jcropSelection;

var verificationId = undefined;
var verificationCounter = 0;
var verificationOutsideChanged = false;
const MAX_VERIFICATIONS = 6; // First verification does nothing but store the current image

var NOTIF_SOUND;

$(document).ready(function() {
    // Store key objects as variables
    $windowList = $("#window-list");
    $preview = $("#preview-img");
    NOTIF_SOUND = $("#notif-sound")[0];

    // Automatically update preview when the windowList is changed
    $windowList.change(updatePreview);

    // Window load hooks
    var lastNatWidth = undefined;
    var lastNatHeight = undefined;
    $preview.on("load", function() {
        var jcropInst = $preview.data("Jcrop");

        // Destroy if the window size has changed
        var natWidth = $preview[0].naturalWidth;
        var natHeight = $preview[0].naturalHeight;

        if (jcropInst && (natWidth !== lastNatWidth || natHeight !== lastNatHeight)) {
            jcropInst.destroy();
            jcropInst = null;
            $preview.css({"width": "100%", "height": "", "display": "", "visiblity": ""});
            M.toast({"html": "The window's size has changed. The selection box has been reset."});
        }

        lastNatWidth = natWidth;
        lastNatHeight = natHeight;

        // Update or create
        if (jcropInst) {
            // Update existing instance
            $preview.data("Jcrop").ui.holder.find("img").attr("src", $preview.attr("src"));
        } else {
            // Initialize
            $preview.Jcrop({
                onSelect: function(c) {
                    // Refresh scale
                    var natSize = [$preview[0].naturalWidth, $preview[0].naturalHeight];
                    var displaySize = $preview.data("Jcrop").getBounds();
                    var scale = [natSize[0] / displaySize[0], natSize[1] / displaySize[1]];

                    // Calculate selection
                    jcropSelection = { // Coords adjusted to provide the smallest box possible when dealing with real numbers
                        x: Math.ceil(c.x * scale[0]),
                        y: Math.ceil(c.y * scale[1]),
                        width: Math.floor(c.w * scale[0]),
                        height: Math.floor(c.h * scale[1])
                    };
                }
            });

            // Set initial selection location
            var defaultSelection = { // TODO: Default box position
                x: 100,
                y: 100,
                width: 100,
                height: 100
            };
            var natSize = [$preview[0].naturalWidth, $preview[0].naturalHeight];
            var displaySize = $preview.data("Jcrop").getBounds();
            var scale = [natSize[0] / displaySize[0], natSize[1] / displaySize[1]];
            console.log(scale, defaultSelection);
            $preview.data("Jcrop").setSelect([defaultSelection.x / scale[0], defaultSelection.y / scale[1], (defaultSelection.x + defaultSelection.width) / scale[0], (defaultSelection.y + defaultSelection.height) / scale[1]]);
        }
    });
    $preview.on("error", function(err) {
        console.error("Failed to load image:", err);
        // TODO: Move this to a status box somewhere and hide it on successful loads!
        M.toast({"html": "Failed to update the preview! Does the window still exist? Has it been closed or minimized? You must keep your selected window maximized at all times for this program to work. This issue can occur regularly if you are running the game in fullscreen mode. Please open the in-game settings -> Video and change \"Screen\" to \"Borderless\" or \"Windowed Mode\" and keep the window maximized (you can use Alt+Tab to navigate to this program without minimizing it)."});
    });

    // Generic buttons
    $("#preview-next").click(function() {
        if (!$windowList.val()) {
            M.toast({html: "You must choose a window to continue."});
            return;
        } else if (!jcropSelection) {
            M.toast({html: "You must select an area to continue."});
            return;
        }

        $("#verification").removeClass("disabled").children(".collapsible-header").click();
        startVerification(false);
    });
    $(".verification-skip").click(function() {
        verificationId = null;
        $("#notifications").removeClass("disabled").children(".collapsible-header").click();
    });
    $("#verification-retry").click(function() {
        startVerification(false);
    });
    $("#test-sound").click(() => { playNotificationSound(true); });
    $("#test-discord").click(() => {
        sendDiscordNotification("This is a test message from ArkNotif");
    });
    $("#start-watching").click(() => {
        startVerification(true);
        $("#preview,#verification,#notifications,#queue-pop").addClass("disabled");
        $("#monitor").removeClass("disabled").find(".collapsible-header").click();
    });
    $("#stop-monitoring,#start-over").click(() => {
        verificationId = undefined;
        $("#preview").removeClass("disabled").find(".collapsible-header").click();
        $("#monitor,#queue-pop").addClass("disabled");
    });

    // Constantly update preview
    setInterval(() => {
        if ($("#preview").hasClass("active")) {
            updatePreview();
        }
    }, 2000);

    // Initial list update
    $("#list-refresh").click(updateList);
    updateList();
});

function updateList() {
    $.get("/list")
    .done(function(windowData) {
        var $windowList = $("#window-list");
        $windowList.children("option[value!='']").remove();

        // Auto-detected list first
        if (windowData.auto.length) {
            $windowList.children("option[disabled]").attr("selected", false);

            for (var i = 0; i < windowData.auto.length; i++) {
                var window = windowData.auto[i];
                var $option = $("<option></option>");
                $option.val(window[0]);
                $option.text(window[1]);
                $windowList.append($option);

                if (i == 0) {
                    $option.attr("selected", true);
                }
            }
        } else {
            $windowList.children("option[disabled]").attr("selected", true);
        }

        // The rest of the windows
        for (var i = 0; i < windowData.windows.length; i++) {
            var window = windowData.windows[i];
            var alreadyDisplayed = false;

            // Verify that we didn't already include this in the auto section
            for (var j = 0; j < windowData.auto.length; j++) {
                if (window[0] === windowData.auto[j][0]) {
                    alreadyDisplayed = true;
                    break;
                }
            }

            if (alreadyDisplayed) {
                continue;
            }

            var $option = $("<option></option>");
            $option.val(window[0]);
            $option.text(window[1]);
            $windowList.append($option);

            /*if (i === 0 && !windowData.auto.length) {
                $option.attr("selected", true);
            }*/
        }

        // Re-initialize the select box and trigger change event
        //$windowList.formSelect("destroy").formSelect();
        $windowList.formSelect("destroy").formSelect();
        $windowList.change();
    }).fail(function(xhr) {
        console.error("Failed to list windows!", xhr);
        M.toast({"html": "Failed to get a list of windows. Please try again or submit a bug report."});
    });
}

function updatePreview() {
    // Get the selected option
    //var $selected = $windowList.children("option[selected]").first();
    //var selectedVals = $windowList.formSelect("getSelectedValues"); // 90% of my reasons for wanting to switch to Bootstrap resolve around MaterializeCSS's select implementation.
                                                                    // Like why would they update this value AFTER calling .change()??
                                                                    // And they don't update the underlying option objects either!
                                                                    // This has been an issue since 2018 btw.
                                                                    // Oh hey wait, MaterializeCSS hasn't had a commit since 2018.
                                                                    // Time to switch frameworks I guess.
    var selectedVal = $windowList.val();
    if (!selectedVal) {
        return; // Nothing to update
    }

    // Update URL
    $preview.attr("src", "/preview?window=" + selectedVal + "&_=" + new Date().getTime());
}

function getSelectionChoice() {
    var selection = {
        window: null,
        area: null
    };

    // Get the current window
    var windowId = $windowList.val();
    if (!windowId) {
        return selection;
    }

    selection.window = parseInt(windowId);

    // Get selected area
    selection.area = jcropSelection;
    return selection;
}

function startVerification(doNotify) {
    if (!doNotify) {
        $("#verification-running").show();
        $("#verification-passed").hide();
        $("#verification-fail").hide();
    }

    var mid = verificationCounter + ":" + new Date().getTime();
    verificationId = mid;
    verificationCounter = 0;
    verificationOutsideChanged = false;
    verificationSelection = getSelectionChoice();

    verificationStep(mid, true, doNotify);
}

function verificationStep(mid, fresh, doNotify) {
    // Only run once verification at once
    if (verificationId !== mid) {
        return;
    }

    // Run verification
    $.ajax({
        "type": "POST",
        "url": "/watch",
        "contentType": "application/json",
        "data": JSON.stringify({"selection": verificationSelection, "fresh": fresh}),
    })
    .done(function(resp) {
        if (doNotify) {
            if (resp.insideChanged) {
                notify();
            } else {
                setTimeout(() => { // Errors return before here
                    verificationStep(mid, false, doNotify);
                }, 2000);
            }
        } else {
            verificationCounter++;

            // Errors
            if (resp.insideChanged) {
                $("#verification-fail-reason").text("Your selected area has changed! Either your queue just popped or you selected an area that is too big. Remember: the smaller the area the better! You only want to select the inside of the queue Cancel button.")
                $("#verification-running").hide();
                $("#verification-passed").hide();
                $("#verification-fail").show();
                return;
            } else if (verificationCounter >= MAX_VERIFICATIONS) {
                if (verificationOutsideChanged) {
                    M.toast({"html": "Verification passed!"});
                    $("#verification-fail").hide();
                    $("#verification-running").hide();
                    $("#verification-passed").show();
                    $(".verification-skip").first().click();
                } else {
                    $("#verification-fail-reason").text("Your game screen appears to be frozen! This can occur when the display mode is set to fullscreen. Please open the in-game settings -> Video and change \"Screen\" to \"Borderless\" or \"Windowed Mode\".")
                    $("#verification-running").hide();
                    $("#verification-passed").hide();
                    $("#verification-fail").show();
                }
                return;
            // OK
            } else if (resp.anyChange) { // resp.insideChanged must be checked before this!
                verificationOutsideChanged = true;
            }

            setTimeout(() => { // Errors return before here
                verificationStep(mid, false, doNotify);
            }, 500);
        }
    }).fail(function(xhr) {
        console.error("Watching failed", xhr);
        M.toast({"html": "An error occurred during watching. Please try again or submit a bug report."});

        try {
            var errorMsg = JSON.parse(xhr.responseText)["msg"];
            $("#verification-fail-reason").text("An error occurred during watching: " + errorMsg);
        } catch {
            $("#verification-fail-reason").text("An unknown error occurred during watching. Please try again or submit a bug report.");
        }

        if (doNotify) {
            $("#notifications,#monitor,#queue-pop").addClass("disabled");
            $("#preview").removeClass("disabled")
            $("#verification").removeClass("disabled").find(".collapsible-header").click();
            $("#verification-running").hide();
            $("#verification-passed").hide();
            $("#verification-fail").show();

            notify("Something went wrong and we were unable to monitor your Ark Queue! Please log back in now!");

            // im being so lazy rn
            $("#notifications,#monitor,#queue-pop").addClass("disabled");
            $("#preview").removeClass("disabled")
            $("#verification").removeClass("disabled").find(".collapsible-header").click();
        } else {
            $("#verification-running").hide();
            $("#verification-passed").hide();
            $("#verification-fail").show();
        }
    });
}

function notify(msg) {
    if ($("#checkbox-notif-discord").is(":checked")) {
        sendDiscordNotification(msg);
    }

    if ($("#checkbox-notif-sound").is(":checked")) {
        playNotificationSound();
        if (msg) {
            setTimeout(() => { alert(msg); }, 3000);
        } else {
            setTimeout(() => { alert("Your queue has popped!"); }, 3000);
        }
    }

    $("#preview,#verification,#notifications,#monitor").addClass("disabled");
    $("#queue-pop").removeClass("disabled").find(".collapsible-header").click();
}

function playNotificationSound(test) {
    NOTIF_SOUND.play();

    if (test) { // protip: don't do what I do here
        setTimeout(() => {
            NOTIF_SOUND.pause();
            NOTIF_SOUND.currentTime = 0;
        }, 2000);
    }
}

function sendDiscordNotification(msg) {
    if (!msg || !msg.length) {
        msg = $("#disc-webhook-msg").val();
    }

    var webhookUrl = $("#disc-webhook-url").val();

    if (!webhookUrl.length) {
        M.toast({"html": "Unable to send Discord notification: no webhook URL has been set."});
        return;
    }

    $.ajax({
        "type": "POST",
        "url": webhookUrl,
        "contentType": "application/json",
        "data": JSON.stringify({"content": msg})
    })
    .done(function(msg) {
        console.log("Successfully sent Discord message!");
    })
    .fail(function(xhr) {
        console.error("Failed to send Discord message!", xhr);
        M.toast({"html": "Failed to send Discord message!"});
    });
}
