class Home {
  constructor(){
    let end = false;
    $("#settings").click(() => {
      end = true;
      load("settings");
    });
    $("#credits").click(() => {
      end = true;
      load("credits");
    });
    let app = [
      {
        "name": "Switch Drivers",
        "page": "drivers",
        "icon": "usb.png"
      },
      {
        "name": "Payload Injection",
        "page": "inject",
        "icon": "rcm.png"
      },
      {
        "name": "SXOS License",
        "page": "sxos",
        "icon": "sxos.png"
      },
      {
        "name": "NSC Builder",
        "page": "nscb",
        "icon": "cmd.png"
      },
      {
        "name": "isMySwitchPatched",
        "page": "imsp",
        "icon": "imsp.png"
      },
      {
        "name": "Homebrew Appstore",
        "page": "appstore",
        "icon": "switchbru.png"
      },
      {
        "name": "Yuzu NAND",
        "page": "yuzu",
        "icon": "yuzu.png"
      }
    ];

    app = app.map((a, n) => {
      if(n == 0) return `<div class="app" style="left:101px" id="${a.page}" n="${n}"><p class="app-text${(a.icon !== null) ? "-image" : ""}">${a.name}</p>${(a.icon !== null) ? `<img src="${path.join(__dirname, "..", "icon", a.icon)}" class="app-image"/>` : ""}</div>`;
      return `<div class="app" style="left:${n*276+101}px" id="${a.page}" n="${n}"><p class="app-text${(a.icon !== null) ? "-image" : ""}">${a.name}</p>${(a.icon !== null) ? `<img src="${path.join(__dirname, "..", "icon", a.icon)}" class="app-image"/>` : ""}</div>`;
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

    function dblclick(i){
      if(end) return;
      end = true;
      load(apps[i].id);
    }
  }
}
module.exports = Home;
