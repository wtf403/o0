const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
} = require("electron");
const { exec } = require("child_process");
const WindowTracker = require("bindings")("window_tracker").WindowTracker;
const windowTracker = new WindowTracker();

let urlBarWindow = null;
let chromeProcess = null;
let isOurWindow = false;
let trackingInterval = null;

function createUrlBar() {
  urlBarWindow = new BrowserWindow({
    width: 600,
    height: 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    backgroundColor: "#00000000",
    hasShadow: true,
    roundedCorners: false,
    movable: false,
    focusable: false,
    skipTaskbar: true,
  });

  urlBarWindow.loadFile("urlbar.html");
}

function changeUrl(url) {
  return `osascript -e 'tell application "Google Chrome" to set URL of active tab of front window to "${url}"'`;
}

function openWindow(url) {
  return `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --app=${url}`;
}

function openInChrome(url) {
  if (!isOurWindow) {
    chromeProcess = exec(openWindow(url), (error) => {
      if (error) {
        console.error("Error opening Chrome:", error);
      }
    });

    chromeProcess.on("exit", () => {
      chromeProcess = null;
      isOurWindow = false;
    });

    isOurWindow = true;
  } else {
    exec(changeUrl(url));
  }
}

function openHomepage() {
  const command = `${openWindow(
    "https://google.com"
  )} && sleep 0.1 && ${changeUrl("chrome://newtab")}`;

  chromeProcess = exec(command, (error) => {
    if (error) {
      console.error("Error opening Chrome:", error);
    } else {
      isOurWindow = true;
      createUrlBar();
    }
  });

  chromeProcess.on("exit", () => {
    chromeProcess = null;
    isOurWindow = false;
  });
}

async function getActiveChromeWindow() {
  const bounds = windowTracker.getChromeWindowBounds();
  return bounds || null;
}

async function updateUrlBarPosition(urlBarWindow) {
  const chromeWindow = await getActiveChromeWindow();

  if (chromeWindow) {
    const centerX = Math.round(
      chromeWindow.x + chromeWindow.width / 2 - urlBarWindow.getSize()[0] / 2
    );
    const centerY = Math.round(
      chromeWindow.y + chromeWindow.height / 2 - urlBarWindow.getSize()[1] / 2
    );

    urlBarWindow.setPosition(centerX, centerY);
    if (!urlBarWindow.isVisible()) {
      urlBarWindow.show();
    }

    urlBarWindow.setAlwaysOnTop(true, "floating", 1);
  } else if (urlBarWindow.isVisible()) {
    urlBarWindow.hide();
  }
}

function startWindowTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
  }

  trackingInterval = setInterval(() => {
    if (urlBarWindow) {
      updateUrlBarPosition(urlBarWindow);
    }
  }, 16);
}

app.whenReady().then(() => {
  openHomepage();
  startWindowTracking();

  globalShortcut.register("CommandOrControl+P", () => {
    if (urlBarWindow.isVisible()) {
      urlBarWindow.hide();
    } else {
      exec(
        "osascript -e 'tell application \"System Events\" to get name of first application process whose frontmost is true'",
        (error, stdout) => {
          if (error) {
            console.error("Error checking active window:", error);
            return;
          }

          if (stdout.trim() === "Google Chrome" && isOurWindow) {
            const point = screen.getCursorScreenPoint();
            urlBarWindow.setPosition(point.x - 300, point.y - 30);
            urlBarWindow.show();
            urlBarWindow.focus();
          }
        }
      );
    }
  });

  ipcMain.on("hide-window", () => {
    urlBarWindow.hide();
  });

  ipcMain.on("open-url", (event, { url }) => {
    openInChrome(url);
    urlBarWindow.hide();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  if (trackingInterval) {
    clearInterval(trackingInterval);
  }
  globalShortcut.unregisterAll();
});
