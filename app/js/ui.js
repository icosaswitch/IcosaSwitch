const $ = require('jquery');
const {remote} = require('electron');
const {getCurrentWindow, dialog} = remote;
const fs = require('fs');
const path = require('path');
const {exec, spawn} = require('child_process');
const platformFolders = require("platform-folders");
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
    const window = getCurrentWindow();
    window.close();
  });
  $("#frame-button-minimize").click(() =>{
    const window = getCurrentWindow();
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
  } if(!fs.existsSync(path.join(root, "payload"))){
    fs.mkdirSync(path.join(root, "payload"));
  }
}

function app(){
  document.getElementById("main").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "main.ejs"), "utf8");
  $("#drivers").click(() => {
    document.getElementById("main").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "drivers", "main.ejs"), "utf8")
    drivers();
  });
  $("#injectbin").click(() => {
    document.getElementById("main").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "injectbin", "main.ejs"), "utf8")
    injectbin();
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
    document.getElementById("tool").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "rcm.ejs"), "utf8");
    $("#continue").click(async () => {
      if(select === "automatic"){
        if(!fs.existsSync(path.join(root, "drivers", "apx_drivers"))){
          document.getElementById("tool").innerHTML = "<p>Downloading...</p>";
          document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
          const res = await fetch('https://github.com/Pharuxtan/IcosaSwitch/releases/download/files/apx_drivers.zip');
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
                document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
            });

            unzipper.on('extract', function (log) {
                document.getElementById("tool").innerHTML = "<p>Accept Administrator permission and install</p>";
                setTimeout(() => {
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
                }, 1000);
                document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
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
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
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
          document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
          const res = await fetch('https://github.com/pbatard/libwdi/releases/download/b721/zadig-2.4.exe');
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
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          } else {
            document.getElementById("tool").innerHTML = "<p>An error occured: "+result+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          }
        } else {
          document.getElementById("tool").innerHTML = '<p>Select the installation via Zadig and accept the privilege increase request that may appear.<br>In the menu bar, click on "Options" then on "List All Devices".<br>In the list at the top of the screen, select "APX" and in the "WCID" section, select "libusbK (v3.0.7.0.0)" (the version may be different) using the "+" button next to it.<br>Finally, click on "Install drivers" or "Replace Driver".<br>Once the driver is installed, Zadig can be closed.</p>';
          exec(path.join(root, "drivers", "zadig.exe"));
        }
      } else {
        if(!fs.existsSync(path.join(root, "drivers", "devicemanager"))){
          document.getElementById("tool").innerHTML = "<p>Downloading...</p>";
          document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
          const res = await fetch('https://github.com/Pharuxtan/IcosaSwitch/releases/download/files/devicemanager.zip');
          let result;
          await new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(path.join(root, "drivers", "devicemanager.zip"));
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

            let unzipper = new DecompressZip(path.join(root, "drivers", "devicemanager.zip"));

            unzipper.on('error', function (err) {
                document.getElementById("tool").innerHTML = "<p>An error occured: "+err+"</p>";
                document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
            });

            unzipper.on('extract', function (log) {
              document.getElementById("tool").innerHTML = '<p>It is possible that the labels I indicate for the different buttons are a little different depending on the version of Windows used, the ones I indicate here are for Windows 7.<br><br>Select the installation via the device manager.<br>Normally, a device named "APX" in the "other devices" section should have a yellow exclamation point, sinifying that the driver is not installed. Right-click on it and click on "Update driver...".<br>In the window that will open, click on "Search for a driver on my computer".<br>On the next screen, click on the "Browse..." button and go to the "%localappdata%\\IcosaSwitch\\devicemanager" folder. It is also preferable to check the box "Include subfolders".<br>Once the configuration is complete, click on the "Next" button and the driver should be installed.<br>Click on the "Finish" button and close the device manager.</p>';
              exec("C:\\Windows\\system32\\control.exe /name Microsoft.DeviceManager");
              document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
            });

            unzipper.on('progress', function (fileIndex, fileCount) {
                console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
            });

            unzipper.extract({
                path: path.join(root, "drivers", "devicemanager"),
                filter: function (file) {
                    return file.type !== "SymbolicLink";
                }
            });
          } else {
            document.getElementById("tool").innerHTML = "<p>An error occured: "+result+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          }
        } else {
          document.getElementById("tool").innerHTML = '<p>It is possible that the labels I indicate for the different buttons are a little different depending on the version of Windows used, the ones I indicate here are for Windows 7.<br><br>Select the installation via the device manager.<br>Normally, a device named "APX" in the "other devices" section should have a yellow exclamation point, sinifying that the driver is not installed. Right-click on it and click on "Update driver...".<br>In the window that will open, click on "Search for a driver on my computer".<br>On the next screen, click on the "Browse..." button and go to the "%localappdata%\\IcosaSwitch\\devicemanager" folder. It is also preferable to check the box "Include subfolders".<br>Once the configuration is complete, click on the "Next" button and the driver should be installed.<br>Click on the "Finish" button and close the device manager.</p>';
          exec("C:\\Windows\\system32\\control.exe /name Microsoft.DeviceManager");
        }
      }
    });
  }
}

function injectbin(){
  $("#mainmenu").click(() => {
    app();
  });
  let file;
  $("#local").click(() => {
    document.getElementById("tool").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "injectbin", "local.ejs"));
    $("#select").click(async () => {
      file = await dialog.showOpenDialog({defaultPath: platformFolders.getDocumentsFolder(), filters: [{name: "*", extensions: ["bin"]}], properties: ['openFile']});
      if(file === undefined) return document.getElementById("file").innerHTML = "Please select a file";
      file = file[0];
      document.getElementById("file").innerHTML = file;
      document.getElementById("inject").setAttribute("style", "visibility: visible;");
    });
    $("#injectbtn").click(() => {
      inject(false);
    });
  });
  $("#online").click(() => {
    document.getElementById("tool").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "injectbin", "online.ejs"));
    let filename,tagname;
    $("#atmosphere").click(async () => {
      const releases = await fetch("https://api.github.com/repos/Atmosphere-NX/Atmosphere/releases");
      const response = await releases.json();
      filename = "atmosphere.bin"
      tagname = response.filter(r => !r.prerelease)[0].tag_name;
      file = response.filter(r => !r.prerelease)[0].assets.find(a => a.name === "fusee-primary.bin").browser_download_url;
      document.getElementById("file").innerHTML = file;
      document.getElementById("inject").setAttribute("style", "visibility: visible;");
    });
    $("#injectbtn").click(() => {
      inject(true, filename, tagname);
    });
  });
  async function inject(url, filename, tagname){
    if(url){
      async function download(){
        const res = await fetch(file);
        let result;
        await new Promise((resolve, reject) => {
          const fileStream = fs.createWriteStream(path.join(root, "payload", filename));
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
          file = path.join(root, "payload", filename);
          return false;
        } else {
          return err;
        }
      }
      if(!fs.existsSync(path.join(root, "payload", "payloads.json"))){
        let json = {};
        json[filename] = tagname
        fs.writeFileSync(path.join(root, "payload", "payloads.json"), JSON.stringify(json, null, 2), function(err){if (err) throw err});
        let err = await download();
        if(err) return document.getElementById("tool").innerHTML = "<p>An error occured: "+err+"</p>";
      } else {
        if(!fs.existsSync(path.join(root, "payload", filename))){
          let json = require(path.join(root, "payload", "payloads.json"));
          json[filename] = tagname
          fs.writeFileSync(path.join(root, "payload", "payloads.json"), JSON.stringify(json, null, 2), function(err){if (err) throw err});
          let err = await download();
          if(err) return document.getElementById("tool").innerHTML = "<p>An error occured: "+err+"</p>";
        } else {
          let json = require(path.join(root, "payload", "payloads.json"));
          let jsontag = json[filename];
          if(jsontag !== tagname){
            json[filename] = tagname
            fs.writeFileSync(path.join(root, "payload", "payloads.json"), JSON.stringify(json, null, 2), function(err){if (err) throw err});
            let err = await download();
            if(err) return document.getElementById("tool").innerHTML = "<p>An error occured: "+err+"</p>";
          } else {
            file = path.join(root, "payload", filename);
          }
        }
      }
    }
    console.log("file");
    document.getElementById("tool").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "rcm.ejs"), "utf8");
    $("#continue").click(async () => {
      if(!fs.existsSync(path.join(root, "TegraRcmSmash.exe"))){
        document.getElementById("tool").innerHTML = "<p>Downloading...</p>";
        document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
        const res = await fetch('https://github.com/Pharuxtan/IcosaSwitch/releases/download/files/TegraRcmSmash.exe');
        let result;
        await new Promise((resolve, reject) => {
          const fileStream = fs.createWriteStream(path.join(root, "TegraRcmSmash.exe"));
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
          document.getElementById("tool").innerHTML = '<p>Injecting...</p><input class="button" type="button" value="Cancel" id="cancel"/>';
          const inj = spawn(path.join(root, "TegraRcmSmash.exe"), ["-w", `${file}`]);

          let error = false;
          let cancel = false;

          inj.stderr.on('data', (data) => {
            error = true;
            document.getElementById("tool").innerHTML = "<p>An error occured: "+data.toString()+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          });

          inj.on('close', (code) => {
            if(error || cancel) return;
            document.getElementById("tool").innerHTML = "<p>Your payload is correctly inject</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          });

          $("#cancel").click(() => {
            cancel = true;
            inj.stdin.pause();
            inj.kill();
            document.getElementById("tool").innerHTML = "<p>You cancelled the injection</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          });
        } else {
          document.getElementById("tool").innerHTML = "<p>An error occured: "+result+"</p>";
          document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
        }
      } else {
        document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
        document.getElementById("tool").innerHTML = '<p>Injecting...</p><input class="button" type="button" value="Cancel" id="cancel"/>';
        const inj = spawn(path.join(root, "TegraRcmSmash.exe"), ["-w", `${file}`]);

        let error = false;
        let cancel = false;

        inj.stderr.on('data', (data) => {
          error = true;
          document.getElementById("tool").innerHTML = "<p>An error occured: "+data.toString()+"</p>";
          document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
        });

        inj.on('close', (code) => {
          if(error || cancel) return;
          document.getElementById("tool").innerHTML = "<p>Your payload is correctly inject</p>";
          document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
        });

        $("#cancel").click(() => {
          cancel = true;
          inj.stdin.pause();
          inj.kill();
          document.getElementById("tool").innerHTML = "<p>You cancelled the injection</p>";
          document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
        });
      }
    });
  }
}
