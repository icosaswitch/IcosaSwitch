class Settings {
  constructor(){
    $("#return").click(() => {
      load("home");
    });
    $("#en").click(() => {
      options.setLang("en");
      document.getElementsByClassName("atitle")[0].innerHTML = "Settings";
      document.getElementById("lang").innerHTML = "Language";
      document.getElementById("en").setAttribute("style", "background-color: #707070");
      document.getElementById("fr").setAttribute("style", "background-color: #505050");
    });
    $("#fr").click(() => {
      options.setLang("fr");
      document.getElementsByClassName("atitle")[0].innerHTML = "Paramètres";
      document.getElementById("lang").innerHTML = "Langue";
      document.getElementById("en").setAttribute("style", "background-color: #505050");
      document.getElementById("fr").setAttribute("style", "background-color: #707070");
    });
    $("#update").click(async () => {
      $("#return").hide();
      if(process.platform !== "darwin"){
        ipcRenderer.on('autoUpdateNotification', (event, arg, info) => {
            switch(arg) {
                case 'checking-for-update': {
                  document.getElementById("app").innerHTML = '<p class="text">'+options.lang.updater.checking+'...</p>';
                  break;
                }
                case 'update-available': {
                  ipcRenderer.send('autoUpdateAction', 'downloadUpdate');
                  break;
                }
                case 'update-not-available': {
                  resolve();
                  break;
                }
                case 'download-progress': {
                  document.getElementById("app").innerHTML = '<p class="text">'+options.lang.downloading+' '+Math.round(info.percent)+'%</p>';
                  break;
                }
                case 'update-downloaded': {
                  document.getElementById("app").innerHTML = '<p class="text">'+options.lang.updater.downloaded+'</p>';
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
                    document.getElementById("app").innerHTML = '<p class="text">'+options.lang.error+': '+err+'</p>';
                    $("#return").show();
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
        document.getElementById("app").innerHTML = '<p class="text">'+options.lang.updater.checking+'...</p>';
        let github = await fetch("https://api.github.com/repos/IcosaSwitch/IcosaSwitch/releases");
        github = await github.json();
        let ver = github[0].tag_name.replace("v", "");
        let packagejson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
        let packagever = packagejson.version;
        if(packagever !== ver){
          let zip = "https://github.com/IcosaSwitch/IcosaSwitch/releases/download/v"+ver+"/IcosaSwitch-"+ver+".dmg";
          let filename = "IcosaSwitch-"+ver+".dmg";
          if(!fs.existsSync(path.join(root, filename))){
            document.getElementById("app").innerHTML = '<p class="text">'+options.lang.downloading+'...</p>';
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
              document.getElementById("app").innerHTML = '<p class="text">'+options.lang.error+': '+result+'</p><div class="availablediv"><input type="button" class="availablebtn" id="continue" value="'+options.lang.updater.continue+'"/></div>';
              $("#continue").click(() => {
                resolve();
              });
            }
          } else {
            install();
          }
          async function install(){
            document.getElementById("app").innerHTML = '<p class="text">'+options.lang.installing+'...</h2>';
            spawn("/System/Library/CoreServices/DiskImageMounter.app/Contents/MacOS/DiskImageMounter", [path.join(root, filename)]);
            const window = getCurrentWindow();
            window.close();
          }
        }
      }
    });
  }
}
module.exports = Settings;
