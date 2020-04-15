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
    $("#discord").click(() => {
      shell.openExternal("https://discord.gg/SE9BrdR");
    });
    let app = [
      {
        "name": "Switch Drivers",
        "page": "drivers",
        "icon": "usb.png",
        "id": 0
      },
      {
        "name": "Payload Injection",
        "page": "inject",
        "icon": "rcm.png",
        "id": 1
      },
      {
        "name": "SXOS License",
        "page": "sxos",
        "icon": "sxos.png",
        "id": 2
      },
      {
        "name": "NSC Builder",
        "page": "nscb",
        "icon": "cmd.png",
        "id": 3
      },
      {
        "name": "isMySwitchPatched",
        "page": "imsp",
        "icon": "imsp.png",
        "id": 4
      },
      {
        "name": "Homebrew Appstore",
        "page": "appstore",
        "icon": "switchbru.png",
        "id": 5
      },
      {
        "name": "Yuzu NAND",
        "page": "yuzu",
        "icon": "yuzu.png",
        "id": 6
      }
    ].sort((a,b) => {
      if(options.favorites.includes(a.id)){
        return -1
      }
    });

    app = app.map((a, n) => {
      if(n == 0) return `<div class="app" style="left:98px" id="${a.page}" i="${a.id}" n="${n}"><p class="app-text${(a.icon !== null) ? "-image" : ""}">${a.name}</p>${(a.icon !== null) ? `<img src="${path.join(__dirname, "..", "icon", a.icon)}" class="app-image"/>` : ""}${(options.favorites.includes(a.id)) ? `<img src="${path.join(__dirname, "..", "icon", "star.png")}" class="app-favorite"/>` : ""}</div>`;
      return `<div class="app" style="left:${n*276+98}px" id="${a.page}" i="${a.id}" n="${n}"><p class="app-text${(a.icon !== null) ? "-image" : ""}">${a.name}</p>${(a.icon !== null) ? `<img src="${path.join(__dirname, "..", "icon", a.icon)}" class="app-image"/>` : ""}${(options.favorites.includes(a.id)) ? `<img src="${path.join(__dirname, "..", "icon", "star.png")}" class="app-favorite"/>` : ""}</div>`;
    });

    app.push(`<div class="app-cursor" style="left:83px"></div><input type="button" style="position: absolute;border:none;outline:none;background-color:transparent;top:0px;width:14px;height:1px;left:${app.length*276+168}px">`)

    $(".applications").html(app.join(""));

    let apps = $(".app");
    let selected = 0;

    apps.click((e) => {
      click(parseInt(e.currentTarget.getAttribute("n")));
    });

    apps.contextmenu((e) => {
      let id = parseInt(e.currentTarget.getAttribute("i"));
      if(options.favorites.includes(id)){
        options.setFav(options.favorites.filter(i => i != id));
        let element = e.currentTarget.getElementsByClassName("app-favorite")[0];
        e.currentTarget.removeChild(element);
      } else {
        options.setFav(options.favorites.concat([id]));
        $(e.currentTarget).append(`<img src="${path.join(__dirname, "..", "icon", "star.png")}" class="app-favorite"/>`)
      }
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
      $(".app-cursor").get(0).setAttribute("style", `left:${i*276+83}px`);
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
