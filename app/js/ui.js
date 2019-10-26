const $ = require('jquery');
const {remote} = require('electron');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const DecompressZip = require('decompress-zip');
const root = (process.platform == "win32") ? path.join(process.env.LOCALAPPDATA, "IcosaSwitch") : '';

$(function() {
  console.log('JQuery Initialized.');
  init();
})

function init() {
  frame();
  verification();
}

function frame() {
  $("#frame-button-close").click(() => {
    const window = remote.getCurrentWindow();
    window.close();
  });
  $("#frame-button-minimize").click(() =>{
    const window = remote.getCurrentWindow();
    window.minimize();
    document.activeElement.blur();
  });
}

function verification(){
  if(process.platform !== "win32"){
    document.getElementById("main").innerHTML = '<h2 class="darwinlinux">This software doesn\'t support OSX or Linux distribution</h4>';
  } else {
    foldercreate();
    app();
  }
}

function foldercreate(){
  if(!fs.existsSync(root)){
    fs.mkdirSync(root);
  } if(!fs.existsSync(path.join(root, "drivers"))){
    fs.mkdirSync(path.join(root, "drivers"));
  }
}

function app(){
  document.getElementById("main").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "main.ejs"), "utf8");
  $("#drivers").click(() => {
    document.getElementById("main").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "drivers", "main.ejs"), "utf8")
    drivers();
  });
}

function drivers(){
  let select;
  $("#mainmenu").click(() => {
    app();
  });
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
  function rcm(){
    document.getElementById("tool").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "drivers", "rcm.ejs"), "utf8")
    $("#continue").click(async () => {
      document.getElementById("tool").innerHTML = fs.readFileSync(path.join(__dirname, "ui", "drivers", select+".ejs"), "utf8")
      if(select === "automatic"){
        
      } else if(select === "zadig"){

      } else {

      }
    });
  }
}
