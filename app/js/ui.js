const $ = require('jquery');
const {remote} = require('electron');
const fs = require('fs');
const path = require('path');
const {exec, spawn} = require('child_process');
const fetch = require('node-fetch');
const DecompressZip = require('decompress-zip');
const root = (process.platform == "win32") ? path.join(process.env.LOCALAPPDATA, "IcosaSwitch") : '';

$(function() {
  console.log('JQuery Initialized.');
  init();
})

function init() {
  frame();
  verification();
}

function frame() {
  $("#frame-button-close").click(() => {
    const window = remote.getCurrentWindow();
    window.close();
  });
  $("#frame-button-minimize").click(() =>{
    const window = remote.getCurrentWindow();
    window.minimize();
    document.activeElement.blur();
  });
}

function verification(){
  if(process.platform !== "win32"){
    document.getElementById("main").innerHTML = '<h2 class="darwinlinux">This software doesn\'t support OSX or Linux distribution</h4>';
  } else {
    foldercreate();
    app();
  }
}

function foldercreate(){
  if(!fs.existsSync(root)){
    fs.mkdirSync(root);
  } if(!fs.existsSync(path.join(root, "drivers"))){
    fs.mkdirSync(path.join(root, "drivers"));
  }
}

function app(){
  document.getElementById("main").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "main.ejs"), "utf8");
  $("#drivers").click(() => {
    document.getElementById("main").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "drivers", "main.ejs"), "utf8")
    drivers();
  });
}

function drivers(){
  let select;
  $("#mainmenu").click(() => {
    app();
  });
  $("#automatic").click(() => {
    select = "automatic";
    rcm();
  });
  $("#zadig").click(() => {
    select = "zadig";
    rcm();
  });
  $("#manager").click(() => {
    select = "manager";
    rcm();
  });
  function rcm(){
    document.getElementById("tool").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "drivers", "rcm.ejs"), "utf8");
    $("#continue").click(async () => {
      if(select === "automatic"){
        if(!fs.existsSync(path.join(root, "drivers", "apx_drivers"))){
          document.getElementById("tool").innerHTML = "<p>Downloading...</p>";
          const res = await fetch('https://github.com/Pharuxtan/IcosaSwitch/releases/download/files/apx_drivers.zip',{
            method: 'GET'
          });
          let result;
          await new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(path.join(root, "drivers", "apx_drivers.zip"));
            res.body.pipe(fileStream);
            res.body.on("error", (err) => {
              result = err;
              reject();
            });
            fileStream.on("finish", function() {
              result = "success"
              resolve();
            });
          });
          if(result === "success"){
            document.getElementById("tool").innerHTML = "<p>Extracting...</p>";

            let unzipper = new DecompressZip(path.join(root, "drivers", "apx_drivers.zip"));

            unzipper.on('error', function (err) {
                document.getElementById("tool").innerHTML = "<p>An error occured: "+err+"</p>";
            });

            unzipper.on('extract', function (log) {
                document.getElementById("tool").innerHTML = "<p>Accept Administrator permission and install</p>";
                const apx = exec(path.join(root, "drivers", "apx_drivers", "InstallDriver.exe"));

                let error = false;

                apx.stderr.on('data', (data) => {
                  error = true;
                  document.getElementById("tool").innerHTML = "<p>An error occured: "+data+"</p>";
                });

                apx.on('close', (code) => {
                  if(error) return;
                  document.getElementById("tool").innerHTML = "<p>You have successfully installed the drivers</p>";
                });
            });

            unzipper.on('progress', function (fileIndex, fileCount) {
                console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
            });

            unzipper.extract({
                path: path.join(root, "drivers", "apx_drivers"),
                filter: function (file) {
                    return file.type !== "SymbolicLink";
                }
            });
          } else {
            document.getElementById("tool").innerHTML = "<p>An error occured: "+result+"</p>";
          }
        } else {
          document.getElementById("tool").innerHTML = "<p>Accept Administrator permission and install</p>";
          const apx = exec(path.join(root, "drivers", "apx_drivers", "InstallDriver.exe"));

          let error = false;

          apx.stderr.on('data', (data) => {
            error = true;
            document.getElementById("tool").innerHTML = "<p>An error occured: "+data+"</p>";
          });

          apx.on('close', (code) => {
            if(error) return;
            document.getElementById("tool").innerHTML = "<p>You have successfully installed the drivers</p>";
          });
        }
      } else if(select === "zadig"){
        if(!fs.existsSync(path.join(root, "drivers", "zadig.exe"))){
          document.getElementById("tool").innerHTML = "<p>Downloading...</p>";
          const res = await fetch('https://github.com/pbatard/libwdi/releases/download/b721/zadig-2.4.exe',{
            method: 'GET'
          });
          let result;
          await new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(path.join(root, "drivers", "zadig.exe"));
            res.body.pipe(fileStream);
            res.body.on("error", (err) => {
              result = err;
              reject();
            });
            fileStream.on("finish", function() {
              result = "success"
              resolve();
            });
          });
          if(result === "success"){
            document.getElementById("tool").innerHTML = '<p>Select the installation via Zadig and accept the privilege increase request that may appear.<br>In the menu bar, click on "Options" then on "List All Devices".<br>In the list at the top of the screen, select "APX" and in the "WCID" section, select "libusbK (v3.0.7.0.0)" (the version may be different) using the "+" button next to it.<br>Finally, click on "Install drivers" or "Replace Driver".<br>Once the driver is installed, Zadig can  be closed.</p>';
            setTimeout(() => {
              exec(path.join(root, "drivers", "zadig.exe"));
            }, 1000);
          } else {
            document.getElementById("tool").innerHTML = "<p>An error occured: "+result+"</p>";
          }
        } else {
          document.getElementById("tool").innerHTML = '<p>Select the installation via Zadig and accept the privilege increase request that may appear.<br>In the menu bar, click on "Options" then on "List All Devices".<br>In the list at the top of the screen, select "APX" and in the "WCID" section, select "libusbK (v3.0.7.0.0)" (the version may be different) using the "+" button next to it.<br>Finally, click on "Install drivers" or "Replace Driver".<br>Once the driver is installed, Zadig can be closed.</p>';
          exec(path.join(root, "drivers", "zadig.exe"));
        }
      } else {
        document.getElementById("tool").innerHTML = '<p>It is possible that the labels I indicate for the different buttons are a little different depending on the version of Windows used, the ones I indicate here are for Windows 7.<br><br>Select the installation via the device manager.<br>Normally, a device named "APX" in the "other devices" section should have a yellow exclamation point, sinifying that the driver is not installed. Right-click on it and click on "Update driver...".<br>In the window that will open, click on "Search for a driver on my computer".<br>On the next screen, click on the "Browse..." button and go to the "tools\drivers\manual_installation_usb_driver" folder in this script. It is also preferable to check the box "Include subfolders".<br>Once the configuration is complete, click on the "Next" button and the driver should be installed.<br>Click on the "Finish" button and close the device manager.</p>';
        exec("C:\\Windows\\system32\\control.exe /name Microsoft.DeviceManager");
      }
    });
  }
}
