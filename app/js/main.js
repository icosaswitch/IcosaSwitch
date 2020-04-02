const $ = require("jquery");
const {remote, ipcRenderer} = require('electron');
const {getCurrentWindow, shell, dialog} = remote;
const ejs = require("ejs");
const fs = require('fs');
const path = require('path');
const usb = require('usb');
const rimraf = require("rimraf");
const pretty = require('prettysize');
const Emitter = require('events').EventEmitter;
const root = (process.platform == "win32") ? path.join(process.env.LOCALAPPDATA, "IcosaSwitch") : (process.platform == "darwin") ? process.env.HOME + '/Library/Application Support/IcosaSwitch' : path.join(process.env.HOME, '.config', 'IcosaSwitch');
const {readICSAFile, writeICSADir} = require("icsa");
const {exec, spawn} = require("child_process");
const checkfolder = (folder) => {
  if(!fs.existsSync(folder)) fs.mkdirSync(folder);
}
checkfolder(root);
const fetch = require("node-fetch");
const FuzzySearch = require(`./js/fuzzy.js`);
const removeDir = async function(dirPath){return new Promise(function(resolve, reject){if(fs.existsSync(dirPath)){return};var list=fs.readdirSync(dirPath);for(var i=0;i<list.length;i++){var filename=path.join(dirPath,list[i]);var stat=fs.statSync(filename);if(filename=="."||filename==".."){}else if(stat.isDirectory()){removeDir(filename)}else{fs.unlinkSync(filename)}};fs.rmdirSync(dirPath);resolve()})}
let options = {
  init: function(){
    if(localStorage.getItem("lang") != "fr" && localStorage.getItem("lang") != "en"){
      if(navigator.language === "fr"){
        localStorage.setItem("lang", "fr");
      } else {
        localStorage.setItem("lang", "en");
      }
    }
    options.lang = JSON.parse(fs.readFileSync(path.join(__dirname, "lang", `${localStorage.getItem("lang")}.json`)));
  },
  lang: {},
  setLang: function(str){
    localStorage.setItem("lang", str);
    options.lang = JSON.parse(fs.readFileSync(path.join(__dirname, "lang", str+".json")));
  }
}
options.init();

$(() => {
  $("#close-window").click(() => {
    getCurrentWindow().close();
  });

  $("#minimize-window").click(function() {
    getCurrentWindow().minimize();
  });

  window.load = (str) => {
    $("#main").html(ejs.render(fs.readFileSync(path.join(__dirname, "html", str+".ejs"), "utf8")));
    new (require(`./js/${str}.js`))();
  }

  window.emitter = new Emitter();
  emitter.setMaxListeners(Infinity);

  let keysdown = {};
  $(document).keydown(function(e){
    if(e.which === 123){
      if(getCurrentWindow().isDevToolsOpened()){
        getCurrentWindow().webContents.closeDevTools();
      } else {
        getCurrentWindow().webContents.openDevTools({mode: "detach"});
      }
      e.preventDefault();
    }
    if(keysdown[e.which]) return;
    keysdown[e.which] = true;
    if(e.which === 38){
      emitter.emit("up");
    } if(e.which === 40){
      emitter.emit("down");
    } if(e.which === 37){
      emitter.emit("left");
    } if(e.which === 39){
      emitter.emit("right");
    } if(e.which === 13){
      emitter.emit("enter");
    }
    $(this).on('keyup', function() {
      delete keysdown[e.which];
    });
  });

  let interval = null;

  window.rcmscreen = async () => {
    document.getElementById("app").innerHTML = `<p class="text">${options.lang.rcm}</p>`;
    return await new Promise(function(resolve, reject) {
      interval = setInterval(() => {
        let test = usb.getDeviceList().find((device) => device.deviceDescriptor.idVendor == 0x0955 && device.deviceDescriptor.idProduct == 0x7321);
        if(test){
          clearInterval(interval);
          resolve(test);
        }
      }, 1);
    });
  }

  window.stoprcm = () => {
    if(interval !== null) clearInterval(interval);
  }

  load("home");
});
