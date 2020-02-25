class YUZU {
  constructor(){
    YUZU.init();
  }

  static async init(){
    let end = false;
    $("#return").click(() => {
      end = true;
      load("home");
    });
    let downloadtotal = 0;
    let download = [];
    const yuzu = await fetch("https://raw.githubusercontent.com/IcosaSwitch/Yuzu-NAND/master/yuzunand.json").then(res => res.json());
    $("#k").html(pretty(yuzu.keys[1]).toUpperCase());
    $("#n").html(pretty(yuzu.nand[1]).toUpperCase());
    let apps = $(".app");
    apps.click(async (e) => {
      let nand = e.currentTarget.id;
      if(nand !== "no"){
        download.push([nand, yuzu[nand][0]]);
        downloadtotal += yuzu[nand][1];
        $("#dlsize").html(pretty(downloadtotal).toUpperCase());
      }

      let app = [
        {
          "name": "No",
          "size": null
        }
      ];

      let firms = Object.keys(yuzu.firm);

      app = app.concat(firms.reverse().map(key => {return {"name":key,"size":yuzu.firm[key][1]}}));

      app = app.map((a, n) => {
        if(n == 0) return `<div class="app" style="left:101px" id="${a.name}" n="${n}"><p class="app-text${(a.size !== null) ? "-size" : ""}">${a.name}</p>${(a.size !== null) ? `<p class="app-size">${pretty(a.size).toUpperCase()}</p>` : ""}</div>`;
        return `<div class="app" style="left:${n*276+101}px" id="${a.name}" n="${n}"><p class="app-text${(a.size !== null) ? "-size" : ""}">${a.name}</p>${(a.size !== null) ? `<p class="app-size">${pretty(a.size).toUpperCase()}</p>` : ""}</div>`;
      });

      app.push(`<div class="app-cursor" style="left:86px"></div><input type="button" style="position: absolute;border:none;outline:none;background-color:transparent;top:0px;width:14px;height:1px;left:${app.length*276+168}px">`)

      $("#q").html(options.lang.yuzu.firm);
      $(".applications").html(app.join(""));

      apps = $(".app");
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

      let downloaded = 0;

      async function downloadfile(file, url){
        let res = await fetch(url);
        let result;
        await new Promise((resolve, reject) => {
          const fileStream = fs.createWriteStream(path.join(root, "yuzu", file));
          res.body.on('data', (chunk) => {
            downloaded += chunk.length;
            $("#downloaded").html(pretty(downloaded).toUpperCase());
            $("#progress").get(0).setAttribute("value", downloaded);
            fileStream.write(chunk);
          });
          res.body.on('end', () => {
            result = "success"
            fileStream.end();
            resolve();
          });
          res.body.on("error", (err) => {
            result = err;
            fileStream.end();
            reject();
          });
        });
        if(result == "success"){
          return false;
        } else {
          fs.unlinkSync(path.join(root, "yuzu", file));
          return err;
        }
      }

      async function dblclick(i){
        if(end) return;
        end = true;
        let firm = apps[i].id;
        $("#return").hide();
        if(firm !== "No"){
          download.push([firm, yuzu.firm[firm][0]]);
          downloadtotal += yuzu.firm[firm][1];
          $("#dlsize").html(pretty(downloadtotal).toUpperCase());
        }
        checkfolder(path.join(root, "yuzu"));
        $("#app").html(`<p class="text">Download: <span id="downloaded">0 Bytes</span> / ${pretty(downloadtotal).toUpperCase()}<br>Speed: <span id="speed">0 Bytes</span>/s<br>Estimated time left: <span id="estimated">0s</span></p><progress max="${downloadtotal}" value="0" id="progress" class="progress"></progress>`)
        let start = (new Date).getTime();
        let before = 0;
        let interval = setInterval(() => {
          var duration = ((new Date).getTime() - start) / 1000;
          var loaded = (downloaded - before) * 8;
          var speed = (loaded / duration) / 8;
          $("#speed").html(pretty(speed).toUpperCase());
          let estimated = (downloadtotal-downloaded)/(speed);
          if(estimated < 60){
            estimated = parseInt(estimated)+"s";
          } else {
            estimated /= 60
            if(estimated < 60){
              estimated = parseInt(estimated)+"min";
            } else {
              estimated = `${parseInt(estimated/60)}h ${parseInt(estimated-60*parseInt(estimated/60))}min`;
            }
          }
          $("#estimated").html(estimated);
          start = (new Date).getTime();
          before = downloaded;
        }, 1000);
        if(!download[0]){
          $("#return").show();
          return $("#app").html("<p class=\"text\">"+options.lang.finish+"</p>");
        }
        let dl = await downloadfile(download[0][0]+".icsa", download[0][1]);
        if(dl){
          clearInterval(interval);
          $("#app").html("<p class=\"text\">"+options.lang.error+": "+dl+"</p>")
        } else {
          try {
            dl = await downloadfile(download[1][0]+".icsa", download[1][1]);
          } catch(e){
            dl = false;
          }
          if(dl){
            clearInterval(interval);
            fs.unlinkSync(path.join(root, "yuzu", download[0][0]+".icsa"));
            $("#app").html("<p class=\"text\">"+options.lang.error+": "+dl+"</p>")
          } else {
            clearInterval(interval);
            $("#app").html("<p class=\"text\">"+options.lang.install+"...</p>")
            let folder = (process.platform == "win32") ? path.join(process.env.APPDATA, "yuzu") : path.join(process.env.HOME, '.local', 'share', 'yuzu-emu');
            checkfolder(folder);
            if(nand == "keys"){
              checkfolder(path.join(folder, "keys"));
              fs.renameSync(path.join(root, "yuzu", download[0][0]+".icsa"), path.join(folder, "keys", "prod.keys"));
            } else if(nand == "nand"){
              await writeICSADir(await readICSAFile(path.join(root, "yuzu", "nand.icsa")), folder);
            } if(firm !== "No"){
              checkfolder(path.join(folder, "nand"));
              checkfolder(path.join(folder, "nand", "system"));
              checkfolder(path.join(folder, "nand", "system", "Contents"));
              if(fs.existsSync(path.join(folder, "nand", "system", "Contents", "registered"))){
                rimraf.sync(path.join(folder, "nand", "system", "Contents", "registered"));
                fs.mkdirSync(path.join(folder, "nand", "system", "Contents", "registered"));
              }
              let i = 0;
              if(download.length == 2) i = 1;
              await writeICSADir(await readICSAFile(path.join(root, "yuzu", download[i][0]+".icsa")), path.join(folder, "nand", "system", "Contents", "registered"));
            }
            $("#app").html("<p class=\"text\">"+options.lang.finish+"</p>");
            if(fs.existsSync(path.join(root, "yuzu", download[0][0]+".icsa"))) fs.unlinkSync(path.join(root, "yuzu", download[0][0]+".icsa"));
            if(download[1]) fs.unlinkSync(path.join(root, "yuzu", download[1][0]+".icsa"));
            $("#return").show();
          }
        }
      }
    });
  }
}
module.exports = YUZU;
