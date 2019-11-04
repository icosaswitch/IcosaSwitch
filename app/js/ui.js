const $ = require('jquery');
const {remote, ipcRenderer} = require('electron');
const {getCurrentWindow, dialog, shell} = remote;
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const {exec, spawn} = require('child_process');
const platformFolders = require("platform-folders");
const fetch = require('node-fetch');
const DecompressZip = require('decompress-zip');
const root = (process.platform == "win32") ? path.join(process.env.LOCALAPPDATA, "IcosaSwitch") : (process.platform == "darwin") ? process.env.HOME + '/Library/Application Support/IcosaSwitch' : path.join(process.env.HOME, '.config', 'IcosaSwitch');

$(function() {
  console.log('JQuery Initialized.');
  init();
})

function init() {
  foldercreate();
  options.init();
  frame();
  verification();
}

let options = {
  init: function(){
    if(!fs.existsSync(path.join(root, "config.json"))){
      if(navigator.language === "fr"){
        options.config = {
          "frame": "win",
          "lang": "fr"
        }
        options.lang = JSON.parse(fs.readFileSync(path.join(__dirname, "lang", "fr.json")));
      } else {
        options.config = {
          "frame": "win",
          "lang": "en"
        }
        options.lang = JSON.parse(fs.readFileSync(path.join(__dirname, "lang", "en.json")));
      }
      fs.writeFileSync(path.join(root, "config.json"), JSON.stringify(options.config, null, 2));
    } else {
      options.config = JSON.parse(fs.readFileSync(path.join(root, "config.json"), "utf8"));
      options.lang = JSON.parse(fs.readFileSync(path.join(__dirname, "lang", options.config.lang+".json")));
    }
  },
  save: function(){
    fs.writeFileSync(path.join(root, "config.json"), JSON.stringify(options.config, null, 2));
  },
  config: {},
  lang: {},
  setFrame: function(str){
    options.config.frame = str;
    options.save();
  },
  setLang: function(str){
    options.config.lang = str;
    options.lang = JSON.parse(fs.readFileSync(path.join(__dirname, "lang", options.config.lang+".json")));
    options.save();
  }
}

let maximized = false;

function frame() {
  if(process.platform === "darwin") return document.getElementById("frame-content").innerHTML = '<div class="frame-drag"></div>';
  if(options.config.frame === "win"){
    document.getElementById("frame-content").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "frame", "frame-win.ejs"), "utf8"));
  } else if(options.config.frame === "osx"){
    document.getElementById("frame-content").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "frame", "frame-osx.ejs"), "utf8"));
  }
  const window = remote.getCurrentWindow();
  $("#frame-button-close").click(() => {
    window.close();
  });
  $("#frame-button-restoredown").click(function() {
    console.log(window.isMaximized());
    if(maximized) {
      maximized = false;
      window.unmaximize();
    } else {
      maximized = true;
      window.maximize();
    }
    document.activeElement.blur();
  });
  $("#frame-button-minimize").click(() =>{
    window.minimize();
    document.activeElement.blur();
  });
}

async function verification(){
  if(process.platform !== "win32" && process.platform !== "darwin" && process.platform !== "linux"){
    document.getElementById("main").innerHTML = '<h2 class="middle">'+options.lang.only+'</h2>';
  } else {
    await updates();
    app();
  }
}

async function updates(){
  return new Promise(async function(resolve, reject){
    if(process.platform !== "darwin"){
      ipcRenderer.on('autoUpdateNotification', (event, arg, info) => {
          switch(arg) {
              case 'checking-for-update': {
                document.getElementById("main").innerHTML = '<h2 class="middle">'+options.lang.updater.checking+'...</h2>';
                break;
              }
              case 'update-available': {
                document.getElementById("main").innerHTML = '<h2 class="available">'+options.lang.updater.available+'</h2><div class="availablediv"><input type="button" class="availablebtn" id="install" value="'+options.lang.updater.install+'"/>  <input type="button" class="availablebtn" id="dont" value="'+options.lang.updater.dont+'"/></div>';
                $("#install").click(() => {
                  ipcRenderer.send('autoUpdateAction', 'downloadUpdate');
                });
                $("#dont").click(() => {
                  resolve();
                });
                break;
              }
              case 'update-not-available': {
                resolve();
                break;
              }
              case 'download-progress': {
                document.getElementById("main").innerHTML = '<h2 class="middle">'+options.lang.downloading+' '+Math.round(info.percent)+'%</h2>';
                break;
              }
              case 'update-downloaded': {
                document.getElementById("main").innerHTML = '<h2 class="middle">'+options.lang.updater.downloaded+'</h2>';
                ipcRenderer.send('autoUpdateAction', 'installUpdate');
              }
              case 'ready': {
                ipcRenderer.send('autoUpdateAction', 'checkForUpdate');
                break;
              }
              case 'realerror': {
                let err;
                console.log(info)
                if(info != null && info.code != null) {
                  if(info.code === 'ERR_UPDATER_INVALID_RELEASE_FEED') {
                      err = 'No suitable releases found.'
                  } else if(info.code === 'ERR_XML_MISSED_ELEMENT') {
                      err = 'No releases found.'
                  } else {
                      err = info.code
                  }
                  document.getElementById("main").innerHTML = '<h2 class="available">'+options.lang.error+': '+err+'</h2><div class="availablediv"><input type="button" class="availablebtn" id="continue" value="'+options.lang.updater.continue+'"/></div>';
                  $("#continue").click(() => {
                    resolve();
                  });
                }
                break;
              }
              default: {
                break;
              }
          }
      });
      ipcRenderer.send('autoUpdateAction', 'initAutoUpdater');
    } else {
      document.getElementById("main").innerHTML = '<h2 class="middle">'+options.lang.updater.checking+'...</h2>';
      let github = await fetch("https://api.github.com/repos/IcosaSwitch/IcosaSwitch/releases");
      github = await github.json();
      let ver = github[0].tag_name.replace("v", "");
      let packagejson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
      let packagever = packagejson.version;
      if(packagever === ver){
        resolve()
      } else {
        document.getElementById("main").innerHTML = '<h2 class="available">'+options.lang.updater.available+'</h2><div class="availablediv"><input type="button" class="availablebtn" id="install" value="'+options.lang.updater.install+'"/>  <input type="button" class="availablebtn" id="dont" value="'+options.lang.updater.dont+'"/></div>';
        $("#install").click(async () => {
          let zip = "https://github.com/IcosaSwitch/IcosaSwitch/releases/download/v"+ver+"/IcosaSwitch-"+ver+".dmg";
          let filename = "IcosaSwitch-"+ver+".dmg";
          if(!fs.existsSync(path.join(root, filename))){
            document.getElementById("main").innerHTML = '<h2 class="middle">'+options.lang.downloading+'...</h2>';
            const res = await fetch(zip);
            let result;
            await new Promise((resolve, reject) => {
              const fileStream = fs.createWriteStream(path.join(root, filename));
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
              install();
            } else {
              document.getElementById("main").innerHTML = '<h2 class="available">'+options.lang.error+': '+result+'</h2><div class="availablediv"><input type="button" class="availablebtn" id="continue" value="'+options.lang.updater.continue+'"/></div>';
              $("#continue").click(() => {
                resolve();
              });
            }
          } else {
            install();
          }
          async function install(){
            document.getElementById("main").innerHTML = '<h2 class="middle">'+options.lang.installing+'...</h2>';
            spawn("/System/Library/CoreServices/DiskImageMounter.app/Contents/MacOS/DiskImageMounter", [path.join(root, filename)]);
            const window = getCurrentWindow();
            window.close();
          }
        });
        $("#dont").click(() => {
          resolve();
        });
      }
    }
  });
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
  document.getElementById("main").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "main.ejs"), "utf8"));
  $("#credits").click(() => {
    document.getElementById("main").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "credits.ejs"), "utf8"));
    credits();
  });
  $("#options").click(() => {
    document.getElementById("main").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "options.ejs"), "utf8"));
    optionspage();
  });
  $("#drivers").click(() => {
    document.getElementById("main").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "drivers", "main.ejs"), "utf8"));
    drivers();
  });
  $("#injectbin").click(() => {
    document.getElementById("main").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "injectbin", "main.ejs"), "utf8"));
    injectbin();
  });
  $("#sxoslicense").click(() => {
    document.getElementById("main").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "sxoslicense", "main.ejs"), "utf8"));
    sxoslicense();
  });
  $("#nscbuilder").click(() => {
    document.getElementById("main").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "nscbuilder", "main.ejs"), "utf8"));
    nscbuilder();
  });
  $("#switchpatch").click(() => {
    document.getElementById("main").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "switchpatch", "main.ejs"), "utf8"));
    switchpatch();
  });
  $("#biskeydump").click(() => {
    document.getElementById("main").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "biskeydump", "main.ejs"), "utf8"));
    biskeydump();
  });
  $("#ulaunch").click(() => {
    document.getElementById("main").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "ulaunch", "main.ejs"), "utf8"));
    ulaunch();
  });
}

function credits(){
  $("#mainmenu").click(() => {
    app();
  });
  $(document).on('click', 'a[href^="http"]', function(event) {
      event.preventDefault();
      shell.openExternal(this.href);
  });
}

function optionspage(){
  $("#mainmenu").click(() => {
    app();
  });
  $("#win").click(() => {
    options.setFrame("win");
    frame();
    document.getElementById("win").setAttribute("style", "background-color: #e60012");
    document.getElementById("osx").setAttribute("style", "background-color: #860012");
  });
  $("#osx").click(() => {
    options.setFrame("osx");
    frame();
    document.getElementById("osx").setAttribute("style", "background-color: #e60012");
    document.getElementById("win").setAttribute("style", "background-color: #860012");
  });
  $("#en").click(() => {
    options.setLang("en");
    document.getElementById("mainmenu").setAttribute("value", "Main Menu");
    document.getElementById("lang").innerHTML = "Language";
    document.getElementById("en").setAttribute("style", "background-color: #e60012");
    document.getElementById("fr").setAttribute("style", "background-color: #860012");
  });
  $("#fr").click(() => {
    options.setLang("fr");
    document.getElementById("mainmenu").setAttribute("value", "Menu principale");
    document.getElementById("lang").innerHTML = "Langue";
    document.getElementById("fr").setAttribute("style", "background-color: #e60012");
    document.getElementById("en").setAttribute("style", "background-color: #860012");
  });
}

function drivers(){
  let select;
  $("#mainmenu").click(() => {
    app();
  });
  if(process.platform === "win32"){
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
  } else {
    $("#continue").click(() => {
      if(process.platform === "darwin"){
        document.getElementById("tool").innerHTML = options.lang.drivers.darwin.home
        $("#continue").click(() => {
          document.getElementById("tool").innerHTML = options.lang.drivers.darwin.dep
          $("#continue").click(() => {
            document.getElementById("tool").innerHTML = options.lang.drivers.darwin.success
          });
        });
      } else {
        document.getElementById("tool").innerHTML = options.lang.drivers.linux.dep
        $("#continue").click(() => {
          document.getElementById("tool").innerHTML = options.lang.drivers.linux.success
        });
      }
    });
  }
  function rcm(){
    document.getElementById("tool").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "rcm.ejs"), "utf8"));
    $("#continue").click(async () => {
      if(select === "automatic"){
        if(!fs.existsSync(path.join(root, "drivers", "apx_drivers"))){
          document.getElementById("tool").innerHTML = "<p>"+options.lang.downloading+"...</p>";
          document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
          const res = await fetch('https://github.com/IcosaSwitch/IcosaSwitch/releases/download/files/apx_drivers.zip');
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
            document.getElementById("tool").innerHTML = "<p>"+options.lang.extracting+"...</p>";

            let unzipper = new DecompressZip(path.join(root, "drivers", "apx_drivers.zip"));

            unzipper.on('error', function (err) {
                document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+err+"</p>";
                document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
            });

            unzipper.on('extract', function (log) {
                document.getElementById("tool").innerHTML = "<p>"+options.lang.drivers.win.autoadmin+"</p>";
                setTimeout(() => {
                  const apx = exec(path.join(root, "drivers", "apx_drivers", "InstallDriver.exe"));

                  let error = false;

                  apx.stderr.on('data', (data) => {
                    error = true;
                    document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+data+"</p>";
                  });

                  apx.on('close', (code) => {
                    if(error) return;
                    document.getElementById("tool").innerHTML = "<p>"+options.lang.drivers.win.autofinish+"</p>";
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
            document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+result+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          }
        } else {
          document.getElementById("tool").innerHTML = "<p>"+options.lang.drivers.win.autoadmin+"</p>";
          const apx = exec(path.join(root, "drivers", "apx_drivers", "InstallDriver.exe"));

          let error = false;

          apx.stderr.on('data', (data) => {
            error = true;
            document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+data+"</p>";
          });

          apx.on('close', (code) => {
            if(error) return;
            document.getElementById("tool").innerHTML = "<p>"+options.lang.drivers.win.autofinish+"</p>";
          });
        }
      } else if(select === "zadig"){
        if(!fs.existsSync(path.join(root, "drivers", "zadig.exe"))){
          document.getElementById("tool").innerHTML = "<p>"+options.lang.downloading+"...</p>";
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
            document.getElementById("tool").innerHTML = options.lang.drivers.win.zadig;
            setTimeout(() => {
              exec(path.join(root, "drivers", "zadig.exe"));
            }, 1000);
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          } else {
            document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+result+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          }
        } else {
          document.getElementById("tool").innerHTML = options.lang.drivers.win.zadig;
          exec(path.join(root, "drivers", "zadig.exe"));
        }
      } else if(select === "manager") {
        if(!fs.existsSync(path.join(root, "drivers", "devicemanager"))){
          document.getElementById("tool").innerHTML = "<p>"+options.lang.downloading+"...</p>";
          document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
          const res = await fetch('https://github.com/IcosaSwitch/IcosaSwitch/releases/download/files/devicemanager.zip');
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
            document.getElementById("tool").innerHTML = "<p>"+options.lang.extracting+"...</p>";

            let unzipper = new DecompressZip(path.join(root, "drivers", "devicemanager.zip"));

            unzipper.on('error', function (err) {
                document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+err+"</p>";
                document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
            });

            unzipper.on('extract', function (log) {
              document.getElementById("tool").innerHTML = options.lang.drivers.win.manager;
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
            document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+result+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          }
        } else {
          document.getElementById("tool").innerHTML = options.lang.drivers.win.manager;
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
    document.getElementById("tool").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "injectbin", "local.ejs"), 'utf8'));
    $("#select").click(async () => {
      file = await dialog.showOpenDialog({defaultPath: platformFolders.getDocumentsFolder(), filters: [{name: "*", extensions: ["bin"]}], properties: ['openFile']});
      if(file.filePaths.length === 0) return document.getElementById("file").innerHTML = options.lang.payload.please;
      file = file.filePaths[0];
      document.getElementById("file").innerHTML = file;
      document.getElementById("inject").setAttribute("style", "visibility: visible;");
    });
    $("#injectbtn").click(() => {
      inject(false);
    });
  });
  $("#online").click(() => {
    document.getElementById("tool").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "injectbin", "online.ejs") , 'utf8'));
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
    $("#incognitorcm").click(async () => {
      const releases = await fetch("https://api.github.com/repos/jimzrt/Incognito_RCM/releases");
      const response = await releases.json();
      filename = "Incognito_RCM.bin"
      tagname = response.filter(r => !r.prerelease)[0].tag_name;
      file = response.filter(r => !r.prerelease)[0].assets.find(a => a.name === "Incognito_RCM.bin").browser_download_url;
      document.getElementById("file").innerHTML = file;
      document.getElementById("inject").setAttribute("style", "visibility: visible;");
    });
    $("#lockpickrcm").click(async () => {
      const releases = await fetch("https://api.github.com/repos/shchmue/Lockpick_RCM/releases");
      const response = await releases.json();
      filename = "Lockpick_RCM.bin"
      tagname = response.filter(r => !r.prerelease)[0].tag_name;
      file = response.filter(r => !r.prerelease)[0].assets.find(a => a.name === "Lockpick_RCM.bin").browser_download_url;
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
        if(err) return document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+err+"</p>";
      } else {
        if(!fs.existsSync(path.join(root, "payload", filename))){
          let json = require(path.join(root, "payload", "payloads.json"));
          json[filename] = tagname
          fs.writeFileSync(path.join(root, "payload", "payloads.json"), JSON.stringify(json, null, 2), function(err){if (err) throw err});
          let err = await download();
          if(err) return document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+err+"</p>";
        } else {
          let json = require(path.join(root, "payload", "payloads.json"));
          let jsontag = json[filename];
          if(jsontag !== tagname){
            json[filename] = tagname
            fs.writeFileSync(path.join(root, "payload", "payloads.json"), JSON.stringify(json, null, 2), function(err){if (err) throw err});
            let err = await download();
            if(err) return document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+err+"</p>";
          } else {
            file = path.join(root, "payload", filename);
          }
        }
      }
    }
    document.getElementById("tool").innerHTML = ejs.render(fs.readFileSync(path.join(__dirname, "ui", "rcm.ejs"), "utf8"));
    $("#continue").click(async () => {
      if(process.platform === "win32"){
        if(!fs.existsSync(path.join(root, "TegraRcmSmash.exe"))){
          document.getElementById("tool").innerHTML = "<p>"+options.lang.downloading+"...</p>";
          document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
          const res = await fetch('https://github.com/IcosaSwitch/IcosaSwitch/releases/download/files/TegraRcmSmash.exe');
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
            document.getElementById("tool").innerHTML = '<p>'+options.lang.payload.injecting+'...</p><input class="button" type="button" value="'+options.lang.payload.cancel+'" id="cancel"/>';
            const inj = spawn(path.join(root, "TegraRcmSmash.exe"), ["-w", `${file}`]);

            let error = false;
            let cancel = false;

            inj.stderr.on('data', (data) => {
              error = true;
              document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+data.toString()+"</p>";
              document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
            });

            inj.on('close', (code) => {
              if(error || cancel) return;
              document.getElementById("tool").innerHTML = "<p>"+options.lang.payload.success+"</p>";
              document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
            });

            $("#cancel").click(() => {
              cancel = true;
              inj.stdin.pause();
              inj.kill();
              document.getElementById("tool").innerHTML = "<p>"+options.lang.payload.cancell+"</p>";
              document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
            });
          } else {
            document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+result+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          }
        } else {
          document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
          document.getElementById("tool").innerHTML = '<p>'+options.lang.payload.injecting+'...</p><input class="button" type="button" value="'+options.lang.payload.cancel+'" id="cancel"/>';
          const inj = spawn(path.join(root, "TegraRcmSmash.exe"), ["-w", `${file}`]);

          let error = false;
          let cancel = false;

          inj.stderr.on('data', (data) => {
            error = true;
            document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+data.toString()+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          });

          inj.on('close', (code) => {
            if(error || cancel) return;
            document.getElementById("tool").innerHTML = "<p>"+options.lang.payload.success+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          });

          $("#cancel").click(() => {
            cancel = true;
            inj.stdin.pause();
            inj.kill();
            document.getElementById("tool").innerHTML = "<p>"+options.lang.payload.cancell+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          });
        }
      } else {
        if(!fs.existsSync(path.join(root, "drivers", "fuseelauncher"))){
          document.getElementById("tool").innerHTML = "<p>"+options.lang.downloading+"...</p>";
          document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
          const res = await fetch('https://github.com/Qyriad/fusee-launcher/archive/1.0.zip');
          let result;
          await new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(path.join(root, "fusee-launcher.zip"));
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
            document.getElementById("tool").innerHTML = "<p>"+options.lang.extracting+"...</p>";

            let unzipper = new DecompressZip(path.join(root, "fusee-launcher.zip"));

            unzipper.on('error', function (err) {
                document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+err+"</p>";
                document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
            });

            unzipper.on('extract', function (log) {
              document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
              document.getElementById("tool").innerHTML = '<p>'+options.lang.payload.injecting+'...</p><input class="button" type="button" value="'+options.lang.payload.cancel+'" id="cancel"/>';
              const inj = spawn("python3", [path.join(root, "fuseelauncher", "fusee-launcher-1.0", "fusee-launcher.py"), `${file}`]);

              let error = false;
              let cancel = false;

              inj.stderr.on('data', (data) => {
                error = true;
                document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+data.toString()+"</p>";
                document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
              });

              inj.on('close', (code) => {
                if(error || cancel) return;
                document.getElementById("tool").innerHTML = "<p>"+options.lang.payload.success+"</p>";
                document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
              });

              $("#cancel").click(() => {
                cancel = true;
                inj.stdin.pause();
                inj.kill();
                document.getElementById("tool").innerHTML = "<p>"+options.lang.payload.cancell+"</p>";
                document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
              });
            });

            unzipper.on('progress', function (fileIndex, fileCount) {
                console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
            });

            unzipper.extract({
                path: path.join(root, "fuseelauncher"),
                filter: function (file) {
                    return file.type !== "SymbolicLink";
                }
            });
          } else {
            document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+result+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          }
        } else {
          document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
          document.getElementById("tool").innerHTML = '<p>'+options.lang.payload.injecting+'...</p><input class="button" type="button" value="'+options.lang.payload.cancel+'" id="cancel"/>';
          const inj = spawn("python3", [path.join(root, "fuseelauncher", "fusee-launcher-1.0", "fusee-launcher.py"), `${file}`]);

          let error = false;
          let cancel = false;

          inj.stderr.on('data', (data) => {
            error = true;
            document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+data.toString()+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          });

          inj.on('close', (code) => {
            if(error || cancel) return;
            document.getElementById("tool").innerHTML = "<p>"+options.lang.payload.success+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          });

          $("#cancel").click(() => {
            cancel = true;
            inj.stdin.pause();
            inj.kill();
            document.getElementById("tool").innerHTML = "<p>"+options.lang.payload.cancell+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          });
        }
      }
    });
  }
}

function sxoslicense(){
  $("#mainmenu").click(() => {
    app();
  });
  let file,csr_data,redeem_code,needlicense;
  $("#select").click(async() => {
    file = await dialog.showOpenDialog({defaultPath: platformFolders.getDocumentsFolder(), filters: [{name: "license-request", extensions: ["dat"]}], properties: ['openFile']});
    file = file.filePaths;
    document.getElementById("sign").setAttribute("style", 'visibility: hidden;');
    document.getElementById("licensetext").setAttribute("style", 'visibility: hidden;');
    if(file.length === 0) return document.getElementById("file").innerHTML = options.lang.sxoslicense.please;
    file = file[0];
    let stat = fs.statSync(file);
    if(stat.size !== 64) return document.getElementById("file").innerHTML = options.lang.sxoslicense["64"];
    document.getElementById("file").innerHTML = file;
    let buf = fs.readFileSync(file);
    let ab = new ArrayBuffer(buf.length);
    let view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
      view[i] = buf[i];
    }
    let bytes = new Uint8Array(ab);
    csr_data = '';
    for(i=0; i<bytes.length; i++) {
      csr_data += ("0" + bytes[i].toString(16)).substr(-2);
    }
    if (csr_data.substr(0x40, 0x40) == "0".repeat(0x40)) {
      needlicense = true;
      document.getElementById("licensetext").setAttribute("style", 'visibility: visible;');
      $("#license").on("change paste keyup", function() {
        let license = $("#license").val();
        license = license.toUpperCase()
        $("#license").val(license);
        if(license.length > 12){
          license = license.substring(0, 12);
          $("#license").val(license);
        }
        if (/^[0-9A-Z]{12}$/.test(license) != true) {
          document.getElementById("sign").setAttribute("style", 'visibility: hidden;');
        } else {
          redeem_code = license;
          document.getElementById("sign").setAttribute("style", 'visibility: visible;');
        }
      });
    } else {
      needlicense = false;
      redeem_code = null;
      document.getElementById("sign").setAttribute("style", 'visibility: visible;');
    }
  });
  $("#sign").click(async () => {
    document.getElementById("tool").innerHTML = "<p>"+options.lang.sxoslicense.signing+"...</p>";
    document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
    var o = {csr_data,redeem_code};
    var r = await fetch('https://sx.xecuter.com/sx-api-server.php?u=sign', {method:'post',body:JSON.stringify(o),headers:{'Content-Type':'application/json'}}).then(res => res.json())
    if ('responseJSON' in r) r = r.responseJSON;
    if ('error' in r) {
      if (r.error == "Invalid license code specified") {
        document.getElementById("tool").innerHTML = "<p>"+options.lang.sxoslicense.key+"</p>";
        return document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
      } else {
        document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+r.error+"</p>";
        return document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
      }
    } else if('status' in r) {
      if(r.status == "License already signed"){
        document.getElementById("tool").innerHTML = "<p>"+options.lang.sxoslicense.already+"</p>";
        return document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
      }
    }
    r = await fetch('https://sx.xecuter.com/sx-api-server.php?u=retrieve', {method:'post',body:JSON.stringify(o),headers:{'Content-Type':'application/json'}}).then(res => res.json());
    if ('responseJSON' in r) {
      r = r.responseJSON;
    }
    var license_file;
    if ('error' in r) {
      document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+r.error+"</p>";
      return document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
    } else {
      license_file = new Uint8Array(r.license.length/2);
      for(var i=0; i<r.license.length/2; i++) {
        license_file[i] = parseInt(r.license.substr(i*2,2),16);
      }
      let datpath = dialog.showSaveDialogSync(null, {defaultPath: path.join(platformFolders.getDocumentsFolder(), 'license.dat')})
      fs.writeFileSync(datpath, new Buffer.from(license_file), function(err){if(err) throw err});
      document.getElementById("tool").innerHTML = '<p>'+path.basename(datpath)+' '+options.lang.sxoslicense.saved+'<br>'+datpath+'</p><input type="button" id="openexplorer" value="'+options.lang.sxoslicense.explorer+'" class="button"/>';
      document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
      $("#openexplorer").click(() => {
        shell.showItemInFolder(datpath);
      });
    }
  });
}

async function nscbuilder(){
  $("#mainmenu").click(() => {
    app();
  });
  if(!fs.existsSync(path.join(root, "nscbuilder", "nscbuilder.version"))){
    document.getElementById("tool").innerHTML = "<p>"+options.lang.downloading+"...</p>";
    document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
    const releases = await fetch("https://api.github.com/repos/julesontheroad/NSC_BUILDER/releases");
    const response = await releases.json();
    let tagname = response.filter(r => !r.prerelease)[0].tag_name;
    let url = response.filter(r => !r.prerelease)[0].assets.find(a => a.name.indexOf("x86") !== -1).browser_download_url;
    const res = await fetch(url);
    let result;
    await new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(path.join(root, "nscbuilder.zip"));
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
      document.getElementById("tool").innerHTML = "<p>"+options.lang.extracting+"...</p>";

      let unzipper = new DecompressZip(path.join(root, "nscbuilder.zip"));

      unzipper.on('error', function (err) {
          document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+err+"</p>";
          document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
      });

      unzipper.on('extract', function (log) {
        fs.writeFileSync(path.join(root, "nscbuilder", "nscbuilder.version"), tagname, function(err){if (err) throw err});
        show();
        document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
      });

      unzipper.on('progress', function (fileIndex, fileCount) {
          console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
      });

      unzipper.extract({
          path: path.join(root, "nscbuilder"),
          filter: function (file) {
              return file.type !== "SymbolicLink";
          }
      });
    } else {
      document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+result+"</p>";
      document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
    }
  } else {
    document.getElementById("tool").innerHTML = "<p>"+options.lang.nscbuilder.checking+"...</p>";
    document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
    const releases = await fetch("https://api.github.com/repos/julesontheroad/NSC_BUILDER/releases");
    const response = await releases.json();
    let tagname = response.filter(r => !r.prerelease)[0].tag_name;
    let check = fs.readFileSync(path.join(root, "nscbuilder", "nscbuilder.version"), 'utf-8');
    if(tagname === check){
      show()
    } else {
      document.getElementById("tool").innerHTML = "<p>"+options.lang.nscbuilder.updates+"...</p>";
      let url = response.filter(r => !r.prerelease)[0].assets.find(a => a.name.indexOf("x86") !== -1).browser_download_url;
      const res = await fetch(url);
      let result;
      await new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(path.join(root, "nscbuilder.zip"));
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
        document.getElementById("tool").innerHTML = "<p>"+options.lang.extracting+"...</p>";

        let unzipper = new DecompressZip(path.join(root, "nscbuilder.zip"));

        unzipper.on('error', function (err) {
            document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+err+"</p>";
            document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
        });

        unzipper.on('extract', function (log) {
          fs.writeFileSync(path.join(root, "nscbuilder", "nscbuilder.version"), tagname, function(err){if (err) throw err});
          show();
          document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
        });

        unzipper.on('progress', function (fileIndex, fileCount) {
            console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
        });

        unzipper.extract({
            path: path.join(root, "nscbuilder"),
            filter: function (file) {
                return file.type !== "SymbolicLink";
            }
        });
      } else {
        document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+result+"</p>";
        document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
      }
    }
  }

  function show(){
    document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
    document.getElementById("tool").innerHTML = "<p>"+options.lang.nscbuilder.launching+"...</p>";
    let nscpath = path.join(root, "nscbuilder", "x86");
    fs.writeFileSync(path.join(nscpath, "ztools", "keys.txt"), 'aes_kek_generation_source = 4d870986c45d20722fba1053da92e8a9\naes_key_generation_source = 89615ee05c31b6805fe58f3da24f7aa8\nbis_kek_source = 34c1a0c48258f8b4fa9e5e6adafc7e4f\nbis_key_00 = c66259c0cb1e2872b8b195981304eb4465cb372db26f9dcb1565a17413ee63dc\nbis_key_01 = a02faf7706c4c856b1fc8043d2e82a2f247395365b1294d8b44610073e3ada48\nbis_key_02 = 39503299db1688abb419cf451c74d46a7c9bbe79f54cc5490dc746a45ed14010\nbis_key_03 = 39503299db1688abb419cf451c74d46a7c9bbe79f54cc5490dc746a45ed14010\nbis_key_source_00 = f83f386e2cd2ca32a89ab9aa29bfc7487d92b03aa8bfdee1a74c3b6e35cb7106\nbis_key_source_01 = 41003049ddccc065647a7eb41eed9c5f44424edab49dfcd98777249adc9f7ca4\nbis_key_source_02 = 52c2e9eb09e3ee2932a10c1fb6a0926c4d12e14b2a474c1c09cb0359f015f4e4\ndevice_key = 28fd627b28ae45b6d5522c5227f9122a\neticket_rsa_kek = 19c8b441d318802bad63a5beda283a84\neticket_rsa_kek_source = dba451124ca0a9836814f5ed95e3125b\neticket_rsa_kekek_source = 466e57b74a447f02f321cde58f2f5535\nheader_kek_source = 1f12913a4acbf00d4cde3af6d523882a\nheader_key = aeaab1ca08adf9bef12991f369e3c567d6881e4e4a6a47a51f6e4877062d542d\nheader_key_source = 5a3ed84fdec0d82631f7e25d197bf5d01c9b7bfaf628183d71f64d73f150b9d2\nkey_area_key_application_00 = ef979e289a132c23d39c4ec5a0bba969\nkey_area_key_application_01 = cdedbab97b69729073dfb2440bff2c13\nkey_area_key_application_02 = 75716ed3b524a01dfe21456ce26c7270\nkey_area_key_application_03 = f428306544cf5707c25eaa8bc0583fd1\nkey_area_key_application_04 = 798844ec099eb6a04b26c7c728a35a4d\nkey_area_key_application_05 = a57c6eecc5410ada22712eb3ccbf45f1\nkey_area_key_application_06 = 2a60f6c4275df1770651d5891b8e73ec\nkey_area_key_application_07 = 32221bd6ed19b938bec06b9d36ed9e51\nkey_area_key_application_08 = fb20aa9e3dbf67350e86479eb431a0b3\nkey_area_key_application_09 = ce8d5fa79e220d5f48470e9f21be018b\nkey_area_key_application_source = 7f59971e629f36a13098066f2144c30d\nkey_area_key_ocean_00 = b33813e4c9c4399c75fabc673ab4947b\nkey_area_key_ocean_01 = c54166efa8c9c0f6511fa8b580191677\nkey_area_key_ocean_02 = 3061ce73461e0b0409d6a33da85843c8\nkey_area_key_ocean_03 = 06f170025a64921c849df168e74d37f2\nkey_area_key_ocean_04 = dc857fd6dc1c6213076ec7b902ec5bb6\nkey_area_key_ocean_05 = 131d76b70bd8a60036d8218c15cb610f\nkey_area_key_ocean_06 = 17d565492ba819b0c19bed1b4297b659\nkey_area_key_ocean_07 = 37255186f7678324bf2b2d773ea2c412\nkey_area_key_ocean_08 = 4115c119b7bd8522ad63c831b6c816a6\nkey_area_key_ocean_09 = 792bfc652870cca7491d1685384be147\nkey_area_key_ocean_source = 327d36085ad1758dab4e6fbaa555d882\nkey_area_key_system_00 = 6dd02aa15b440d6231236b6677de86bc\nkey_area_key_system_01 = 4ab155e7f29a292037fd147592770b12\nkey_area_key_system_02 = b7a74adeaf89c2a198c327bdff322d7d\nkey_area_key_system_03 = d5aab1acd23a8aec284a316df859d377\nkey_area_key_system_04 = 9b44b45b37de9d14754b1d22c2ca742c\nkey_area_key_system_05 = 0012e957530d3dc7af34fbbe6fd44559\nkey_area_key_system_06 = 01744e3b0818445cd54ee9f89da43192\nkey_area_key_system_07 = d0d30e46f5695b875f11522c375c5a80\nkey_area_key_system_08 = bd06cb1b86bd5c433667470a09eb63de\nkey_area_key_system_09 = e19f788f658eda8bbf34a1dd2a9503a9\nkey_area_key_system_source = 8745f1bba6be79647d048ba67b5fda4a\nkeyblob_00 = f759024f8199101dddc1ef91e6eecf37e24b95ac9272f7ae441d5d8060c843a48322d21cdd06d4fc958c68d3800eb4db939ffbec930177f77d136144ff615aa8835e811bb958deda218f8486b5a10f531b30cb9d269645ac9fc25c53fc80525e56bd3602988a9fcf06bbf99ca910ad6530791d512c9d57e17abf49220de6419bf4eca1685c1e4df77f19db7b44a985ca\nkeyblob_01 = bd27264ae07e979756411d0c66e679e3c50851f3e902d9c2cd1a438b948159a517ec1566c10570326ea2697ee62da46f14bb5d581bfc06fd0c9387ea33d2d4dc63e7809ba90f03dd2c7112ffbfa548951b9b8c688b5e4f2951d24a73da29c668154a5d4838dba71ee068ace83fe720e8c2a495c596f73525dc3c05994b40ad27f8c60322f75cd548b821af9162e16f76\nkeyblob_02 = a3d4a8e153b8e6ae6e6aef3e8f219cb4b7790f47856accc76268f9afa99a1ff8b1a72f63d1f99f480a3c1532078bb59abdd25203cfb12a38b33e9ba6a09afb6f24283b3ba76a0161230a73669ddf5493c2b7919d094fd795b484794854f71e4f4c672245d7770e29397722444d111b4229cdbf35707b70634ea8f140766e884cc580cb1e2d9aa9866ffef920010fc409\nkeyblob_03 = 1558f525ae8c5be9243fb6d8a8b0a8ee0e886a59035668740a936619b7a5c83e821198b171d18e51445054df68688e45703b936818a827d8e540dd6bef2e11ec9ddc6cfe5fc736dd769b9f6e0a23a62e2e5f49e86143646a04ec3a23f828373a336a5c224a91f8a0c6c6a7b5844dd6415804209f83c943aeca9cfd856db6bd4ec32009c8cb268ed053052c9237dfd8bc\nkeyblob_04 = 9fbeb1957fc1629e08b753a9086d6e01ffb4f11466b7417e3fa7f5f1efb754406704fd75afaf91a408a0b524c1fc80d36c2046fa4757412efe4c11e382f72e8a10d90ed580017d9deb87af2549b6b02661af48ff94f6072c0fef7fc2833b8bdae503898e2e927ac0663e8b6391dd4f1d685313935e2c48ece7d177c88bc9c883ede36c3677495784b838d7265c6ba7a1\nkeyblob_05 = 94a92da1d73c2b3e165c891ced5607fc6628ca2a0654f3fbc05711c063377c6e9c96a9d0192e530dd510e4fd41aa62ef4213c5f6e059e7e21db098a9b22d1e6c29bee148aaef15c52549d9165de96e85b0d029ecdc5843e2f32cb18be707eec61909cf3385d45bc2a4c8d76e9bfad5a40c4b92dcb982aa50d474897ac9ebb5351a7015dcc277a08f1214ad41384d7941\nkeyblob_key_00 = 5d48e5cba63023ca7ffd2f4a6942b3bc\nkeyblob_key_01 = 77616d9b4d4da52f699f1f4ac28b7398\nkeyblob_key_02 = 4ba97e7dd839b05e8796e3407a20906d\nkeyblob_key_03 = 1e9b604a6aa61c74084503081abc1e2e\nkeyblob_key_04 = a2463ea19d6b1095965bd6d0041b624f\nkeyblob_key_05 = 4836ff126144bb54cdea3c5012d06024\nkeyblob_key_source_00 = df206f594454efdc7074483b0ded9fd3\nkeyblob_key_source_01 = 0c25615d684ceb421c2379ea822512ac\nkeyblob_key_source_02 = 337685ee884aae0ac28afd7d63c0433b\nkeyblob_key_source_03 = 2d1f4880edeced3e3cf248b5657df7be\nkeyblob_key_source_04 = bb5a01f988aff5fc6cff079e133c3980\nkeyblob_key_source_05 = d8cce1266a353fcc20f32d3b517de9c0\nkeyblob_mac_key_00 = f04bd62757102fe55fb7e009709d5dc2\nkeyblob_mac_key_01 = b24e737842eec68ef33ecf3c6f3b3d8d\nkeyblob_mac_key_02 = 1027c10511bfd8c443205d2fc08acceb\nkeyblob_mac_key_03 = 297655a5c42727fd8d3c92f61288c54a\nkeyblob_mac_key_04 = 7dd5519a75c16a118bf86dff69386398\nkeyblob_mac_key_05 = ec867dd246e30c5be0b86ffa70bef213\nkeyblob_mac_key_source = 59c7fb6fbe9bbe87656b15c0537336a5\nmaster_kek_00 = f759024f8199101dddc1ef91e6eecf37\nmaster_kek_01 = bd27264ae07e979756411d0c66e679e3\nmaster_kek_02 = a3d4a8e153b8e6ae6e6aef3e8f219cb4\nmaster_kek_03 = 1558f525ae8c5be9243fb6d8a8b0a8ee\nmaster_kek_04 = 9fbeb1957fc1629e08b753a9086d6e01\nmaster_kek_05 = 94a92da1d73c2b3e165c891ced5607fc\nmaster_kek_source_06 = 294c04c8eb10ed9d516497fbf34d50dd\nmaster_kek_source_07 = decfebeb10ae74d8ad7cf49e62e0e872\nmaster_kek_source_08 = 0a0ddf3422066ca4e6b1ec7185ca4e07\nmaster_kek_source_09 = 6e7d2dc30f59c8fa87a82ed5895ef3e9\nmaster_key_00 = c2caaff089b9aed55694876055271c7d\nmaster_key_01 = 54e1b8e999c2fd16cd07b66109acaaa6\nmaster_key_02 = 4f6b10d33072af2f250562bff06b6da3\nmaster_key_03 = 84e04ec20b9373818c540829cf147f3d\nmaster_key_04 = cfa2176790a53ff74974bff2af180921\nmaster_key_05 = c1dbedcebf0dd6956079e506cfa1af6e\nmaster_key_06 = 0aa90e6330cdc12d819b3254d11a4e1e\nmaster_key_07 = 929f86fbfe4ef7732892bf3462511b0e\nmaster_key_08 = 23cfb792c3cb50cd715da0f84880c877\nmaster_key_09 = 75c93b716255319b8e03e14c19dea64e\nmaster_key_source = d8a2410ac6c59001c61d6a267c513f3c\npackage1_key_00 = f4eca1685c1e4df77f19db7b44a985ca\npackage1_key_01 = f8c60322f75cd548b821af9162e16f76\npackage1_key_02 = c580cb1e2d9aa9866ffef920010fc409\npackage1_key_03 = c32009c8cb268ed053052c9237dfd8bc\npackage1_key_04 = ede36c3677495784b838d7265c6ba7a1\npackage1_key_05 = 1a7015dcc277a08f1214ad41384d7941\npackage2_key_00 = a35a19cb14404b2f4460d343d178638d\npackage2_key_01 = a0dd1eacd438610c85a191f02c1db8a8\npackage2_key_02 = 7e5ba2aafd57d47a85fd4a57f2076679\npackage2_key_03 = bf03e9889fa18f0d7a55e8e9f684323d\npackage2_key_04 = 09df6e361e28eb9c96c9fa0bfc897179\npackage2_key_05 = 444b1a4f9035178b9b1fe262462acb8e\npackage2_key_06 = 442cd9c21cfb8914587dc12e8e7ed608\npackage2_key_07 = 70c821e7d6716feb124acbac09f7b863\npackage2_key_08 = 8accebcc3d15a328a48365503f8369b6\npackage2_key_09 = f562a7c6c42e3d4d3d13ffd504d77346\npackage2_key_source = fb8b6a9c7900c849efd24d854d30a0c7\nper_console_key_source = 4f025f0eb66d110edc327d4186c2f478\nretail_specific_aes_key_source = e2d6b87a119cb880e822888a46fba195\nrsa_oaep_kek_generation_source = a8ca938434127fda82cc1aa5e807b112\nrsa_private_kek_generation_source = ef2cb61a56729b9157c38b9316784ddd\nsave_mac_kek_source = d89c236ec9124e43c82b038743f9cf1b\nsave_mac_key = f39e58082f5158bbfbc6fed6dc577bfe\nsave_mac_key_source = e4cd3d4ad50f742845a487e5a063ea1f\nsd_card_kek_source = 88358d9c629ba1a00147dbe0621b5432\nsd_card_nca_key_source = 5841a284935b56278b8e1fc518e99f2b67c793f0f24fded075495dca006d99c2\nsd_card_save_key_source = 2449b722726703a81965e6e3ea582fdd9a951517b16e8f7f1f68263152ea296a\nsd_seed = 48481926189964026f8c6d799af2944b\nsecure_boot_key = 60fd863ca1ab9b1e805cbbda35a80ed8\nssl_rsa_kek = b011100660d1dccbad1b1b733afa9f95\nssl_rsa_kek_source_x = 7f5bb0847b25aa67fac84be23d7b6903\nssl_rsa_kek_source_y = 9a383bf431d0bd8132534ba964397de3\ntitlekek_00 = 62a24d6e6d0d0e0abf3554d259be3dc9\ntitlekek_01 = 8821f642176969b1a18021d2665c0111\ntitlekek_02 = 5d15b9b95a5739a0ac9b20f600283962\ntitlekek_03 = 1b3f63bcb67d4b06da5badc7d89acce1\ntitlekek_04 = e45c1789a69c7afbbf1a1e61f2499459\ntitlekek_05 = ddc67f7189f4527a37b519cb051eee21\ntitlekek_06 = b1532b9d38ab036068f074c0d78706ac\ntitlekek_07 = 81dc1b1783df268789a6a0edbf058343\ntitlekek_08 = 47dfe4bf0eeda88b17136b8005ab08ea\ntitlekek_09 = adaa785d90e1a9c182ac07bc276bf600\ntitlekek_source = 1edc7b3b60e6b4d878b81715985e629b\ntsec_key = 787a20633a4bad672902d96f50dc2ec0', function(err){if (err) throw err});
    const apx = exec("start C:\\Windows\\system32\\cmd.exe /c\"" + path.join(nscpath, "NSCB.bat") + "\"", {
      cwd: nscpath,
      localDir: nscpath,
      encoding: "utf8"
    });

    document.getElementById("tool").innerHTML = "<p>"+options.lang.nscbuilder.success+"</p>";
  }
}

function switchpatch(){
  $("#mainmenu").click(() => {
    app();
  });
  let serial,prefix,number;
  function safeResult() {
    document.getElementById("ispatch").innerHTML = options.lang.imsp.unpatched;
    document.getElementById("ispatch").setAttribute("style", "color: #7cfc00;");
  }
  function possiblyPatchedResult() {
    document.getElementById("ispatch").innerHTML = options.lang.imsp.possibly;
    document.getElementById("ispatch").setAttribute("style", "color: #ffa500;");
  }
  function patchedResult() {
    document.getElementById("ispatch").innerHTML = options.lang.imsp.patched;
    document.getElementById("ispatch").setAttribute("style", "color: #ff4500;");
  }
  function unknownResult(){
    document.getElementById("ispatch").innerHTML = options.lang.imsp.unknown;
    document.getElementById("ispatch").setAttribute("style", "color: #f5f6fa;");
  }
  $("#serial").on("change paste keyup", function() {
    serial = $("#serial").val();
    serial = serial.toUpperCase()
    $("#serial").val(serial);
    if(serial.length > 14){
      serial = serial.substring(0, 14);
      $("#serial").val(serial);
    }
    if(serial === ""){
      return document.getElementById("ispatch").innerHTML = "";
    } else if(!new RegExp(/[X][A-Z]{2}[0-9]{7,11}/g).test(serial)){
      document.getElementById("ispatch").innerHTML = options.lang.imsp.not;
      document.getElementById("ispatch").setAttribute("style", "color: #f5f6fa;");
      return
    } else {
      document.getElementById("ispatch").innerHTML = "";
    }
    prefix = serial.substring(0, 4);
    number = parseInt(serial.substring(4, 10));
    if(prefix.startsWith("XKW") && prefix.startsWith("XKJ")){
      return patchedResult();
    } else if(prefix.startsWith("XAK")){
      return possiblyPatchedResult();
    }
    switch(prefix){
      case "XAW1": {
        if(number <= 7499){
          safeResult();
        } else if(number >= 7500 && number <= 12000){
          possiblyPatchedResult();
        } else {
          patchedResult();
        }
        break;
      }
      case "XAW4": {
        if(number <= 1100){
          safeResult();
        } else if(number > 1100 && number <= 1200){
          possiblyPatchedResult();
        } else {
          patchedResult();
        }
        break;
      }
      case "XAW7": {
        if(number <= 1780){
          safeResult();
        } else if(number > 1780 && number <= 3000){
          possiblyPatchedResult();
        } else {
          patchedResult();
        }
        break;
      }
      case "XAJ1": {
        if(number <= 2000){
          safeResult();
        } else if(number > 2000 && number <= 3000){
          possiblyPatchedResult();
        } else {
          patchedResult();
        }
        break;
      }
      case "XAJ4": {
        if(number <= 4600){
          safeResult();
        } else if(number > 4600 && number <= 8300){
          possiblyPatchedResult();
        } else {
          patchedResult();
        }
        break;
      }
      case "XAJ7": {
        if(number <= 4000){
          safeResult();
        } else if(number > 4000 && number <= 5000){
          possiblyPatchedResult();
        } else {
          patchedResult();
        }
        break;
      }
      case "XAW9": {
        patchedResult();
        break;
      }
      default: {
        unknownResult();
      }
    }
  });
}

function biskeydump(){
  $("#mainmenu").click(() => {
    app();
  });
  $("#continue").click(async () => {
    if(process.platform === "win32"){
      if(!fs.existsSync(path.join(root, "TegraRcmSmash.exe"))){
        document.getElementById("tool").innerHTML = "<p>"+options.lang.downloading+"...</p>";
        document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
        const res = await fetch('https://github.com/IcosaSwitch/IcosaSwitch/releases/download/files/TegraRcmSmash.exe');
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
          biskeydl();
        } else {
          document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+result+"</p>";
          document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
        }
      } else {
        biskeydl();
      }
    } else {
      if(!fs.existsSync(path.join(root, "drivers", "fuseelauncher"))){
        document.getElementById("tool").innerHTML = "<p>"+options.lang.downloading+"...</p>";
        document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
        const res = await fetch('https://github.com/Qyriad/fusee-launcher/archive/1.0.zip');
        let result;
        await new Promise((resolve, reject) => {
          const fileStream = fs.createWriteStream(path.join(root, "fusee-launcher.zip"));
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
          document.getElementById("tool").innerHTML = "<p>"+options.lang.extracting+"...</p>";

          let unzipper = new DecompressZip(path.join(root, "fusee-launcher.zip"));

          unzipper.on('error', function (err) {
              document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+err+"</p>";
              document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
          });

          unzipper.on('extract', function (log) {
            biskeydl();
          });

          unzipper.on('progress', function (fileIndex, fileCount) {
              console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
          });

          unzipper.extract({
              path: path.join(root, "fuseelauncher"),
              filter: function (file) {
                  return file.type !== "SymbolicLink";
              }
          });
        } else {
          document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+result+"</p>";
          document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
        }
      } else {
        biskeydl();
      }
    }
  });
  async function biskeydl(){
    if(!fs.existsSync(path.join(root, "biskeydump.bin"))){
      document.getElementById("tool").innerHTML = "<p>"+options.lang.downloading+"...</p>";
      document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
      const res = await fetch('https://github.com/IcosaSwitch/IcosaSwitch/releases/download/files/biskeydump.bin');
      let result;
      await new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(path.join(root, "biskeydump.bin"));
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
        install();
      } else {
        document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+result+"</p>";
        document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
      }
    } else {
      install();
    }
  }
  function install(){
    if(process.platform === "win32"){
      document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
      document.getElementById("tool").innerHTML = '<p>'+options.lang.payload.injecting+'...</p><input class="button" type="button" value="'+options.lang.payload.cancel+'" id="cancel"/>';
      const inj = exec(`"${path.join(root, "TegraRcmSmash.exe")}" -w "${path.join(root, "biskeydump.bin")}" > "${path.join(root, "biskeydump.txt")}"`);

      let error = false;
      let cancel = false;

      inj.stderr.on('data', (data) => {
        error = true;
        document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+data.toString()+"</p>";
        document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
      });

      inj.on('close', (code) => {
        if(error || cancel) return;
        document.getElementById("tool").innerHTML = "<p>"+options.lang.payload.biskey+"</p><p>"+path.join(root, "biskeydump.txt")+"</p>"+'<input type="button" id="openexplorer" value="'+options.lang.sxoslicense.explorer+'" class="button"/>';
        document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
        $("#openexplorer").click(() => {
          shell.showItemInFolder(path.join(root, "biskeydump.txt"));
        });
      });

      $("#cancel").click(() => {
        cancel = true;
        spawn("taskkill", ["/pid", inj.pid, '/f', '/t']);
        document.getElementById("tool").innerHTML = "<p>"+options.lang.payload.cancell+"</p>";
        document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
      });
    } else {
      document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
      document.getElementById("tool").innerHTML = '<p>'+options.lang.payload.injecting+'...</p><input class="button" type="button" value="'+options.lang.payload.cancel+'" id="cancel"/>';
      const inj = exec(`python3 "${path.join(root, "fuseelauncher", "fusee-launcher-1.0", "fusee-launcher.py")}" "${path.join(root, "biskeydump.bin")}" > "${path.join(root, "biskeydump.txt")}"`);

      let error = false;
      let cancel = false;

      inj.stderr.on('data', (data) => {
        error = true;
        document.getElementById("tool").innerHTML = "<p>"+options.lang.error+": "+data.toString()+"</p>";
        document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
      });

      inj.on('close', (code) => {
        if(error || cancel) return;
        document.getElementById("tool").innerHTML = "<p>"+options.lang.payload.biskey+"</p><p>"+path.join(root, "biskeydump.txt")+"</p>"+'<input type="button" id="openexplorer" value="'+options.lang.sxoslicense.explorer+'" class="button"/>';
        document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
        $("#openexplorer").click(() => {
          shell.showItemInFolder(path.join(root, "biskeydump.txt"));
        });
      });

      $("#cancel").click(() => {
        cancel = true;
        inj.stdin.pause();
        inj.kill();
        document.getElementById("tool").innerHTML = "<p>"+options.lang.payload.cancell+"</p>";
        document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
      });
    }
  }
}

async function ulaunch(){
  document.getElementById("tool").innerHTML = '<h2 class="middle">'+options.lang.ulaunch.loading+'</h2>';
  document.getElementById("mainmenu").setAttribute("style", 'visibility: hidden;');
  let tool = "";
  let themes = await fetch("https://raw.githubusercontent.com/IcosaSwitch/uLaunch-Themes/master/themes.json").then(res => res.json());
  document.getElementById("tool").innerHTML = '<h2 class="middle">'+options.lang.ulaunch.loading+' 0/'+themes.length+'</h2>';
  for(var i=0; i<themes.length; i++){
    document.getElementById("tool").innerHTML = '<h2 class="middle">'+options.lang.ulaunch.loading+' '+(i+1)+'/'+themes.length+'</h2>';
    let num = i;
    let theme = themes[num];
    let ui = theme.ui;
    let mainmenu = ui["main_menu"];
    if(mainmenu["top_menu_bg"]["visible"]){mainmenu["top_menu_bg"]["visible"] = "visible"}else{mainmenu["top_menu_bg"]["visible"] = "hidden"}
    if(mainmenu["banner_image"]["visible"]){mainmenu["banner_image"]["visible"] = "visible"}else{mainmenu["banner_image"]["visible"] = "hidden"}
    if(mainmenu["logo_icon"]["visible"]){mainmenu["logo_icon"]["visible"] = "visible"}else{mainmenu["logo_icon"]["visible"] = "hidden"}
    if(mainmenu["connection_icon"]["visible"]){mainmenu["connection_icon"]["visible"] = "visible"}else{mainmenu["connection_icon"]["visible"] = "hidden"}
    if(mainmenu["user_icon"]["visible"]){mainmenu["user_icon"]["visible"] = "visible"}else{mainmenu["user_icon"]["visible"] = "hidden"}
    if(mainmenu["web_icon"]["visible"]){mainmenu["web_icon"]["visible"] = "visible"}else{mainmenu["web_icon"]["visible"] = "hidden"}
    if(mainmenu["time_text"]["visible"]){mainmenu["time_text"]["visible"] = "visible"}else{mainmenu["time_text"]["visible"] = "hidden"}
    if(mainmenu["battery_text"]["visible"]){mainmenu["battery_text"]["visible"] = "visible"}else{mainmenu["battery_text"]["visible"] = "hidden"}
    if(mainmenu["battery_icon"]["visible"]){mainmenu["battery_icon"]["visible"] = "visible"}else{mainmenu["battery_icon"]["visible"] = "hidden"}
    if(mainmenu["settings_icon"]["visible"]){mainmenu["settings_icon"]["visible"] = "visible"}else{mainmenu["settings_icon"]["visible"] = "hidden"}
    if(mainmenu["themes_icon"]["visible"]){mainmenu["themes_icon"]["visible"] = "visible"}else{mainmenu["themes_icon"]["visible"] = "hidden"}
    if(mainmenu["firmware_text"]["visible"]){mainmenu["firmware_text"]["visible"] = "visible"}else{mainmenu["firmware_text"]["visible"] = "hidden"}
    if(mainmenu["menu_toggle_button"]["visible"]){mainmenu["menu_toggle_button"]["visible"] = "visible"}else{mainmenu["menu_toggle_button"]["visible"] = "hidden"}
    if(mainmenu["banner_name_text"]["visible"]){mainmenu["banner_name_text"]["visible"] = "visible"}else{mainmenu["top_menu_bg"]["banner_name_text"] = "hidden"}
    if(mainmenu["banner_author_text"]["visible"]){mainmenu["banner_author_text"]["visible"] = "visible"}else{mainmenu["banner_author_text"]["visible"] = "hidden"}
    if(mainmenu["banner_version_text"]["visible"]){mainmenu["banner_version_text"]["visible"] = "visible"}else{mainmenu["banner_version_text"]["visible"] = "hidden"}
    size = theme.size;
    let textcolor = ui["text_color"];
    let over = 37+377*(num+1);
    let field = 37+377*num;
    let font = `@font-face { font-family: 'Custom'; font-style: normal; src: url('${theme.preview.font}'); }`;
    num = `dl${num}`;
    tool += ejs.render(fs.readFileSync(path.join(__dirname, "ui", "ulaunch", "theme.ejs"), "utf8"), {num,theme,over,field,mainmenu,textcolor,font,size});
  }
  document.getElementById("tool").innerHTML = tool;
  document.getElementById("mainmenu").setAttribute("style", 'visibility: visible;');
  $("#mainmenu").click(() => {
    app();
  });
  let downloading = new Set();
  $(document).on('click', 'input[id^="dl"]', async function(event) {
    let id = parseInt(this.id.replace("dl", ""));
    if(downloading.has(id)){
      if(this.value.indexOf("Open") !== -1 || this.value.indexOf("Ouvrir") !== -1){
        let documents = path.join(platformFolders.getDocumentsFolder(), "IcosaSwitch", "ulaunch");
        let files = themes[id].files;
        let folder = Object.keys(files)[0];
        shell.showItemInFolder(path.join(documents, folder));
        return
      } else {
        return
      }
    };
    downloading.add(id);
    this.value = options.lang.downloading+" (0%)"
    let maxed = 0;
    let dldo = 0;
    let documents = path.join(platformFolders.getDocumentsFolder(), "IcosaSwitch");
    let files = themes[id].files;
    let folder = Object.keys(files)[0];
    if(!fs.existsSync(documents)){
      fs.mkdirSync(documents);
    }
    documents = path.join(documents, "ulaunch");
    if(!fs.existsSync(documents)){
      fs.mkdirSync(documents);
    }
    if(!fs.existsSync(path.join(documents, folder))){
      fs.mkdirSync(path.join(documents, folder));
    }
    let folders = Object.keys(files[folder]);
    for(var f=0; f<folders.length; f++){
      let fold = folders[f];
      if(!fs.existsSync(path.join(documents, folder, fold))){
        fs.mkdirSync(path.join(documents, folder, fold));
      }
      let file = files[folder][fold];
      let filespath = path.join(documents, folder, fold);
      for(var ur=0; ur<file.length; ur++){
        let url = file[ur];
        maxed++
      }
    }
    for(var f=0; f<folders.length; f++){
      let fold = folders[f];
      if(!fs.existsSync(path.join(documents, folder, fold))){
        fs.mkdirSync(path.join(documents, folder, fold));
      }
      let file = files[folder][fold];
      let filespath = path.join(documents, folder, fold);
      for(var ur=0; ur<file.length; ur++){
        let url = file[ur]
        let filename = url.split("/").slice(-1)[0];
        const res = await fetch(url);
        let result;
        await new Promise((resolve, reject) => {
          const fileStream = fs.createWriteStream(path.join(filespath, filename));
          res.body.pipe(fileStream);
          res.body.on("error", (err) => {
            console.log(err);
            reject();
          });
          fileStream.on("finish", function() {
            resolve();
          });
        });
        dldo++
        this.value = options.lang.downloading+" ("+Math.trunc((100*dldo)/maxed)+"%)";
      }
    }
    this.value = options.lang.ulaunch.explorer;
  });
}
