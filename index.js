const {app, BrowserWindow, ipcMain, Menu} = require('electron');
const {autoUpdater} = require('electron-updater');
const path = require('path');
const url = require('url');
const ejse = require('ejs-electron');
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

let frame;
let isInitAutoUpdater = false;
Menu.setApplicationMenu(null);

function initAutoUpdater(event) {
    autoUpdater.autoDownload = false;
    autoUpdater.allowPrerelease = true;

    autoUpdater.on('update-available', info => {
      event.sender.send('autoUpdateNotification', 'update-available', info);
    });
    autoUpdater.on('update-downloaded', info => {
      event.sender.send('autoUpdateNotification', 'update-downloaded', info);
    });
    autoUpdater.on('download-progress', (info) => {
      event.sender.send('autoUpdateNotification', 'download-progress', info);
    });
    autoUpdater.on('update-not-available', info => {
      event.sender.send('autoUpdateNotification', 'update-not-available', info);
    });
    autoUpdater.on('checking-for-update', () => {
      event.sender.send('autoUpdateNotification', 'checking-for-update');
    });
    autoUpdater.on('error', (err) => {
      event.sender.send('autoUpdateNotification', 'realerror', err);
    });
}

app.disableHardwareAcceleration();

app.on("ready", () => {
  ipcMain.on('autoUpdateAction', async (event, arg, data) => {
      switch(arg) {
          case 'initAutoUpdater': {
              if(!isInitAutoUpdater) {
                  initAutoUpdater(event);
                  isInitAutoUpdater = true;
              }
              event.sender.send('autoUpdateNotification', 'ready');
              break;
          }
          case 'checkForUpdate': {
              autoUpdater.checkForUpdates().catch(err => {
                  event.sender.send('autoUpdateNotification', 'realerror', err);
              });
              break;
          }
          case 'downloadUpdate': {
            console.log("download");
              autoUpdater.downloadUpdate();
              break;
          }
          case 'installUpdate': {
              autoUpdater.quitAndInstall();
              break;
          }
          default: {
              console.log('Unknown argument', arg);
              break;
          }
      }
  });
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

  frame.webContents.openDevTools({mode: "detach"})

  frame.resizable = false;

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
