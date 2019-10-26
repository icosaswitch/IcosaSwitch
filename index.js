const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const ejse = require('ejs-electron');

let frame;

app.on("ready", () => {
  if(process.platform === "darwin"){
    frame = new BrowserWindow({
      width: 1280,
      height: 720,
      frame: true,
      icon: getPlatformIcon('icon'),
      webPreferences: {
          nodeIntegration: true
      },
      titleBarStyle: "hiddenInset",
      backgroundColor: '#2f3640',
      maximizable: false
    });
  } else {
    frame = new BrowserWindow({
      width: 1280,
      height: 720,
      frame: false,
      icon: getPlatformIcon('icon'),
      webPreferences: {
          nodeIntegration: true
      },
      backgroundColor: '#2f3640'
    });
  }

  frame.loadURL(url.format({
    pathname: path.join(__dirname, 'app', 'app.ejs'),
    protocol: 'file:',
    slashes: true
  }));

  frame.setMenu(null);
  frame.setResizable(false);

  frame.on('closed', () => {
    frame = null;
  });
});

function getPlatformIcon(filename) {
    const os = process.platform;
    if(os === 'darwin') {
        filename = filename + '.icns';
    }
    else if(os === 'win32') {
        filename = filename + '.ico';
    }
    else {
        filename = filename + '.png';
    }
    return path.join(__dirname, 'app', 'icons', filename);
}
