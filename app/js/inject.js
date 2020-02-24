class Inject {
  constructor(){
    Inject.init();
  }

  static async init(){
    let isinject = false;
    let end = false;
    $("#return").click(() => {
      if(isinject) return;
      end = true;
      stoprcm();
      load("home");
    });
    let app = [
      {
        "name": "Inject from file",
        "mode": "file",
        "icon": null
      },
      {
        "name": "Atmosphère",
        "mode": "atmosphere",
        "icon": "atmosphere.png"
      },
      {
        "name": "Incognito RCM",
        "mode": "incognito",
        "icon": "incognito.png"
      },
      {
        "name": "Lockpick RCM",
        "mode": "lockpick",
        "icon": "lockpickrcm.png"
      },
      {
        "name": "Hekate",
        "mode": "hekate",
        "icon": "hekate.png"
      },
      {
        "name": "Argon NX",
        "mode": "argon-nx",
        "icon": "argon.png"
      }
    ];

    app = app.map((a, n) => {
      if(n == 0) return `<div class="app" style="left:101px" id="${a.mode}" n="${n}"><p class="app-text${(a.icon !== null) ? "-image" : ""}">${a.name}</p>${(a.icon !== null) ? `<img src="${path.join(__dirname, "..", "icon", a.icon)}" class="app-image"/>` : ""}</div>`;
      return `<div class="app" style="left:${n*276+101}px" id="${a.mode}" n="${n}"><p class="app-text${(a.icon !== null) ? "-image" : ""}">${a.name}</p>${(a.icon !== null) ? `<img src="${path.join(__dirname, "..", "icon", a.icon)}" class="app-image"/>` : ""}</div>`;
    });

    app.push(`<div class="app-cursor" style="left:86px"></div><input type="button" style="position: absolute;border:none;outline:none;background-color:transparent;top:0px;width:14px;height:1px;left:${app.length*276+168}px">`)

    $(".applications").html(app.join(""));

    let apps = $(".app");
    let selected = 0;

    apps.click((e) => {
      click(parseInt(e.currentTarget.getAttribute("n")));
    });

    emitter.on("left", () => {
      click(selected-1, true);
    });

    emitter.on("right", () => {
      click(selected+1, false);
    });

    emitter.on("enter", () => {
      dblclick(selected);
    });

    apps.dblclick((e) => {
      dblclick(parseInt(e.currentTarget.getAttribute("n")));
    });

    function click(i, left){
      if(end) return;
      if(apps[i] == undefined) return;
      selected = i;
      $(".app-cursor").get(0).setAttribute("style", `left:${i*276+86}px`);
      let scroll = $(".applications").get(0).scrollLeft;
      if(i*276 > scroll){
        if(i*276-276*3 < scroll) return;
        $(`.applications`).animate({
            scrollLeft: i*276-276*3
        }, 0);
      } else {
        $(`.applications`).animate({
            scrollLeft: i*276
        }, 0);
      }
    }

    let file;

    async function download(mode){
      const res = await fetch(file);
      let result;
      await new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(path.join(root, "payload", `${mode}.bin`));
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
        file = path.join(root, "payload", `${mode}.bin`);
        return false;
      } else {
        return err;
      }
    }

    async function dblclick(i){
      if(end) return;
      end = true;
      $("#return").hide();
      let mode = apps[i].id;
      if(mode != "file"){
        checkfolder(path.join(root, "payload"));
        let versions = await fetch("https://raw.githubusercontent.com/IcosaSwitch/payload/master/version.json").then(res => res.json());
        if(!fs.existsSync(path.join(root, "payload", "payloads.json"))){
          let payload = {};
          payload[mode] = versions[mode];
          file = `https://github.com/IcosaSwitch/payload/blob/master/${mode}.bin?raw=true`;
          let dl = await download();
          if(dl){
            return document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+dl+"</p>";
          } else {
            fs.writeFileSync(path.join(root, "payload", "payloads.json"), JSON.stringify(payload), "utf8");
          }
          fs.writeFileSync(path.join(root, "payload", "payloads.json"), JSON.stringify(payload), "utf8");
        } else if(!fs.existsSync(path.join(root, "payload", `${mode}.bin`))){
          let payload = JSON.parse(fs.readFileSync(path.join(root, "payload", "payloads.json"), "utf8"));
          payload[mode] = versions[mode];
          file = `https://github.com/IcosaSwitch/payload/blob/master/${mode}.bin?raw=true`;
          let dl = await download();
          if(dl){
            return document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+dl+"</p>";
          } else {
            fs.writeFileSync(path.join(root, "payload", "payloads.json"), JSON.stringify(payload), "utf8");
          }
          fs.writeFileSync(path.join(root, "payload", "payloads.json"), JSON.stringify(payload), "utf8");
        } else {
          let payload = JSON.parse(fs.readFileSync(path.join(root, "payload", "payloads.json"), "utf8"));
          if(payload[mode] != versions[mode]){
            payload[mode] = versions[mode];
            file = `https://github.com/IcosaSwitch/payload/blob/master/${mode}.bin?raw=true`;
            let dl = await download();
            if(dl){
              return document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+dl+"</p>";
            } else {
              fs.writeFileSync(path.join(root, "payload", "payloads.json"), JSON.stringify(payload), "utf8");
            }
          }
        };
      } else {
        file = dialog.showOpenDialogSync({defaultPath: (process.platform == "win32") ? "C:\\" : "\\", filters: [{name: "*", extensions: ["bin"]}], properties: ['openFile']});
        if(file == undefined) return end = false;
        file = file[0];
      }
      $("#return").show();
      await rcmscreen();
      $("#return").hide();
      if(process.platform == "win32"){
        if(!fs.existsSync(path.join(root, "TegraRcmSmash.exe"))){
          document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.download+": "+dl+"</p>";
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
          if(result !== "success"){
            return document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+result+"</p>";
          }
        }
        document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.payload.injecting+"</p>";
        const inj = spawn(path.join(root, "TegraRcmSmash.exe"), ["-w", `${file}`]);
        isinject = true;
        $("#return").show();

        let error = false;
        let cancel = false;

        inj.stderr.on('data', (data) => {
          error = true;
          document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+data.toString()+"</p>";
        });

        inj.on('close', (code) => {
          if(error || cancel) return;
          error = true;
          document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.payload.success+"</p>";
        });

        $("#return").click(() => {
          cancel = true;
          if(!error){
            inj.stdin.pause();
            inj.kill();
          }
          load("home");
        });
      } else {
        if(!fs.existsSync(path.join(root, "fuseelauncher"))){
          document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.download+": "+dl+"</p>";
          const res = await fetch('https://github.com/IcosaSwitch/IcosaSwitch/releases/download/files/fuseelauncher.icsa');
          let result;
          await new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(path.join(root, "fuseelauncher.icsa"));
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
          } else {
            await writeICSADir(await readICSAFile(path.join(root, "fuseelauncher.icsa")), path.join(root, "fuseelauncher"));
            fs.unlinkSync(path.join(root, "fuseelauncher.icsa"));
          }
        }
        document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.payload.injecting+"</p>";
        const inj = spawn("python3", [path.join(root, "fuseelauncher", "fusee-launcher.py"), `${file}`]);
        isinject = true;
        $("#return").show();

        let error = false;
        let cancel = false;

        inj.stderr.on('data', (data) => {
          error = true;
          document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+data.toString()+"</p>";
        });

        inj.on('close', (code) => {
          if(error || cancel) return;
          error = true;
          document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.payload.success+"</p>";
        });

        $("#return").click(() => {
          cancel = true;
          if(!error){
            inj.stdin.pause();
            inj.kill();
          }
          load("home");
        });
      }
    }
  }
}
module.exports = Inject;
