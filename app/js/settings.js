class Settings {
  constructor(){
    $("#return").click(() => {
      load("home");
    });
    $("#en").click(() => {
      options.setLang("en");
      document.getElementsByClassName("atitle")[0].innerHTML = "Settings";
      document.getElementById("lang").innerHTML = "Language";
      document.getElementById("theme").innerHTML = "Theme";
      document.getElementById("light").setAttribute("value", "Light");
      document.getElementById("dark").setAttribute("value", "Dark");
      document.getElementById("en").setAttribute("style", `background-color: ${localStorage.getItem("color") !== "light" ? "#707070" : "#8f8f8f"}`);
      document.getElementById("fr").setAttribute("style", `background-color: ${localStorage.getItem("color") !== "light" ? "#505050" : "#afafaf"}`);
    });
    $("#fr").click(() => {
      options.setLang("fr");
      document.getElementsByClassName("atitle")[0].innerHTML = "Paramètres";
      document.getElementById("lang").innerHTML = "Langue";
      document.getElementById("theme").innerHTML = "Thème";
      document.getElementById("light").setAttribute("value", "Clair");
      document.getElementById("dark").setAttribute("value", "Sombre");
      document.getElementById("en").setAttribute("style", `background-color: ${localStorage.getItem("color") !== "light" ? "#505050" : "#afafaf"}`);
      document.getElementById("fr").setAttribute("style", `background-color: ${localStorage.getItem("color") !== "light" ? "#707070" : "#8f8f8f"}`);
    });
    $("#dark").click(() => {
      options.setColor("dark");
      $("#bootstrap").get(0).setAttribute("href", "./css/bootstrap.css");
      $("#en").get(0).setAttribute("style", $("#en").get(0).getAttribute("style").replace("afafaf", "505050").replace("8f8f8f", "707070"));
      $("#fr").get(0).setAttribute("style", $("#fr").get(0).getAttribute("style").replace("afafaf", "505050").replace("8f8f8f", "707070"));
      $("#dark").get(0).setAttribute("style", "background-color: #707070");
      $("#light").get(0).setAttribute("style", "background-color: #505050");
    });
    $("#light").click(() => {
      options.setColor("light");
      $("#bootstrap").get(0).setAttribute("href", "./css/bootstraplight.css");
      $("#en").get(0).setAttribute("style", $("#en").get(0).getAttribute("style").replace("505050", "afafaf").replace("707070", "8f8f8f"));
      $("#fr").get(0).setAttribute("style", $("#fr").get(0).getAttribute("style").replace("505050", "afafaf").replace("707070", "8f8f8f"));
      $("#dark").get(0).setAttribute("style", "background-color: #afafaf");
      $("#light").get(0).setAttribute("style", "background-color: #8f8f8f");
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
                  document.getElementById("app").innerHTML = '<p class="text">No update</p>';
                  $("#return").show();
                  break;
                }
                case 'download-progress': {
                  document.getElementById("app").innerHTML = '<p class="text">'+options.lang.download+' '+Math.round(info.percent)+'%</p>';
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
        let packagejson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "package.json"), "utf8"));
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
