class Appstore {
  constructor(){
    Appstore.init();
  }

  static async init(){
    let isapp = false;
    $("#return").click(() => {
      if(isapp) return;
      load("home");
    });
    $("#app").html('<p class="text">Loading...</h2>');
    $("#appimg").get(0).setAttribute("src", `data:image/png;base64,${fs.readFileSync(path.join(__dirname, "..", "icon", "switchbrunoscreen.png")).toString("base64")}`);
    let json = await fetch("https://switchbru.com/appstore/repo.json").then(res => res.json());
    let packages = json.packages.map(pack => {
      return {
        "category": pack.category,
        "updated": pack.updated,
        "name": pack.name,
        "author": pack.author,
        "license": pack.license,
        "title": pack.title,
        "details": pack.details,
        "version": pack.version,
        "icon": `https://switchbru.com/appstore/packages/${pack.name}/icon.png`,
        "screen": `https://switchbru.com/appstore/packages/${pack.name}/screen.png`,
        "download": `https://switchbru.com/appstore/zips/${pack.name}.zip`,
        "switchbru": `https://switchbru.com/appstore/#/app/${pack.name}`,
        "source": pack.url
      }
    });
    $("#app").html(`<style>input.search {width: 1044px}</style><label class="search"><input id="search" type="text" class="search" placeholder="Search"></label><div class="appGrid" style="width:1114px;font-family:'OpenSans';overflow-y:auto"></div>`);
    let searchtitle = [];
    let searchauthor = [];
    packages.map(async (pack, i) => {
      $(".appGrid").append(`<div class="appGrid__item"><div id="package${i}"><a class="card card--app"><img src="${pack.icon}" onerror="this.src='data:image/png;base64,${fs.readFileSync(path.join(__dirname, "..", "icon", "switchbru404.png")).toString("base64")}'" class="app__image"><div class="card__head">${pack.title}</div><div class="card__body"><div class="app__desc">${pack.version}</div><div class="app__author">${pack.author}</div></div></a></div></div>`);
      $(`#package${i}`).click((e) => {
        click(e.currentTarget.id.replace("package", ""));
      });
      searchtitle.push(pack.title.toLowerCase());
      searchauthor.push(pack.author.toLowerCase());
    });
    function click(id) {
      isapp = true;
      let pkg = packages[id];
      $("#appimg").get(0).setAttribute("src", pkg.screen);
      $("#appimg").get(0).setAttribute("onerror", `this.src='data:image/png;base64,${fs.readFileSync(path.join(__dirname, "..", "icon", "switchbrunoscreen.png")).toString("base64")}'`);
      $("#apptitle").html(pkg.title);
      $("#download").get(0).setAttribute("href", pkg.download);
      $("#source").get(0).setAttribute("href", pkg.source);
      $("#switchbru").get(0).setAttribute("href", pkg.switchbru);
      $("#desc").html(pkg.details.replace(/\\n/g, "<br />"));
      $("#info").show();
      $("#return").click(() => {
        if(!isapp) return;
        $("#divd").get(0).scrollTop = 0;
        $("#appimg").get(0).setAttribute("src", `data:image/png;base64,${fs.readFileSync(path.join(__dirname, "..", "icon", "switchbrunoscreen.png")).toString("base64")}`);
        $("#info").hide();
        isapp = false;
      });
    }
    let result = null;
    $("#search").on("change paste keyup", function() {
      let search = $("#search").val().toLowerCase();
      if(search != ""){
        let resulttitle = FuzzySearch(searchtitle, [], {}, search);
        let resultauthor = FuzzySearch(searchauthor, [], {}, search);
        result = resulttitle.concat(resultauthor);
        let items = $(".appGrid").get(0).childNodes;
        for(var i=0; i<items.length; i++){
          let item = items[i]
          if(result.includes(i)){
            $(item).show();
          } else {
            $(item).hide();
          }
        }
      } else {
        result = null;
        let items = $(".appGrid").get(0).childNodes;
        for(var i=0; i<items.length; i++){
          let item = items[i]
          $(item).show();
        }
      }
    });
  }
}
module.exports = Appstore;
