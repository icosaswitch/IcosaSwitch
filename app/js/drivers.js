class Drivers {
  constructor(){
    Drivers.init();
  }

  static async init(){
    $("#return").click(() => {
      stoprcm();
      load("home");
    });

    if(process.platform == "win32"){
      let apps = $(".app");

      apps.click(async (e) => {
        let mode = e.currentTarget.id;
        await rcmscreen();
        checkfolder(path.join(root, "drivers"));
        if(mode == "automatic"){
          if(!fs.existsSync(path.join(root, "drivers", "apx_drivers"))){
            document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.download+"...</p>";
            const res = await fetch('https://github.com/IcosaSwitch/IcosaSwitch/releases/download/files/apx_drivers.icsa');
            let result;
            await new Promise((resolve, reject) => {
              const fileStream = fs.createWriteStream(path.join(root, "drivers", "apx_drivers.icsa"));
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
            if(result == "success"){
              await writeICSADir(await readICSAFile(path.join(root, "drivers", "apx_drivers.icsa")), path.join(root, "drivers", "apx_drivers"));
              fs.unlinkSync(path.join(root, "drivers", "apx_drivers.icsa"))
            } else {
              return document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+result+"</p>";
            }
          }
          return await new Promise((resolve, reject) => {
            document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.install+"...</p>";

            const apx = exec(path.join(root, "drivers", "apx_drivers", "InstallDriver.exe"));

            apx.stderr.on('data', (data) => {
              resolve(document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+data+"</p>");
            });

            apx.on('close', (code) => {
              resolve(document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.finish+"</p>");
            });
          });
        } else if(mode == "zadig"){
          if(!fs.existsSync(path.join(root, "drivers", "zadig.exe"))){
            document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.download+"...</p>";
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
            if(result !== "success"){
              return document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+result+"</p>";
            }
          }
          document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.drivers.zadig+"</p>";
          setTimeout(() => {
            exec(path.join(root, "drivers", "zadig.exe"));
          }, 2500);
          return;
        } else if(mode == "devicemanager"){
          if(!fs.existsSync(path.join(root, "drivers", "devicemanager"))){
            document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.downloading+"...</p>";
            const res = await fetch('https://github.com/IcosaSwitch/IcosaSwitch/releases/download/files/devicemanager.icsa');
            let result;
            await new Promise((resolve, reject) => {
              const fileStream = fs.createWriteStream(path.join(root, "drivers", "devicemanager.icsa"));
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
            if(result == "success"){
              await writeICSADir(await readICSAFile(path.join(root, "drivers", "devicemanager.icsa")), path.join(root, "drivers", "devicemanager"));
              fs.unlinkSync(path.join(root, "drivers", "devicemanager.icsa"))
            } else {
              return document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+result+"</p>";
            }
          }
          document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.drivers.manager+"</p>";
          exec("C:\\Windows\\system32\\control.exe /name Microsoft.DeviceManager");
          return;
        }
      });
    }
  }
}
module.exports = Drivers;
