class SXOS {
  constructor(){
    SXOS.init();
  }

  static async init(){
    $("#return").click(() => {
      load("home");
    });
    $("#select").click(async () => {
      let filepath = dialog.showOpenDialogSync({title: "Open SXOS License Request file", defaultPath: (process.platform == "win32") ? "C:\\" : "\\", filtres: [{ name : 'SXOS License Request', extensions: ['dat'] }], properties: ['openFile'] });
      if(filepath == undefined) return document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+options.lang.sxos.nofile+"</p>";
      let file = fs.readFileSync(filepath[0]);
      if(file.length !== 64) return document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+options.lang.sxos.sixtyfour+"</p>";
      let csr_data = '';
      for(let i=0; i<file.length; i++){
        csr_data += ("0"+file[i].toString(16)).substr(-2);
      }
      let license = null;
      if(csr_data.substr(0x40, 0x40) == "0".repeat(0x40)){
        await new Promise(function(resolve, reject) {
          document.getElementById("app").innerHTML = `<p class="text">${options.lang.sxos.license}</p><input type="text" class="license" id="license" value=""/><input type="button" class="btn" id="sign" style="position:absolute;top:100px;left:50%;transform:translate(-50%);visibility: hidden;" value="sign">`
          $("#license").on("change paste keyup", function() {
            let licensetext = $("#license").val();
            licensetext = licensetext.toUpperCase();
            $("#license").val(licensetext);
            if(licensetext.length > 12){
              licensetext = licensetext.substring(0, 12);
              $("#license").val(licensetext);
            }
            if (/^[0-9A-Z]{12}$/.test(licensetext) != true) {
              document.getElementById("sign").setAttribute("style", 'position:absolute;top:100px;left:50%;transform:translate(-50%);visibility: hidden;');
            } else {
              license = licensetext;
              document.getElementById("sign").setAttribute("style", 'position:absolute;top:100px;left:50%;transform:translate(-50%);visibility: visible;');
            }
          });
          $("#sign").click(() => {
            resolve();
          });
        });
      }
      document.getElementById("app").innerHTML = `<p class="text">${options.lang.sxos.sign}...</p>`
      let data;
      if(license != null){
        data = {csr_data: csr_data, redeem_code: license}
      } else {
        data = {csr_data: csr_data}
      }
      let res = await fetch("https://sx.xecuter.com/sx-api-server.php?u=sign", {method: "POST", body: JSON.stringify(data)}).then(res => res.json());
      if('responseJSON' in res){
        res = res.responseJSON;
      }
      if('error' in res){
        return document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+res.error+"</p>";
      } else {
        res = await fetch("https://sx.xecuter.com/sx-api-server.php?u=retrieve", {method: "POST", body: JSON.stringify(data)}).then(res => res.json());
        console.log(res);
        if('responseJSON' in res){
          res = res.responseJSON;
        }
        if('error' in res){
          return document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+res.error+"</p>";
        } else {
          let license_file = Buffer.alloc(res.license.length/2);
          for(let i=0; i<res.license.length/2; i++){
            license_file[i] = parseInt(res.license.substr(i*2,2),16);
          }
          document.getElementById("app").innerHTML = `<p class=\"text\">${options.lang.sxos.licensetext}</p>`;
          let save = dialog.showSaveDialogSync({title: "Save SXOS License file", nameFieldLabel: "license", properties: ["createDirectory"], defaultPath: (process.platform == "win32") ? "C:\\" : "\\", filtres: [{ name : 'SXOS License', extensions: ['dat'] }] });
          if(save !== undefined) fs.writeFileSync(save, license_file, "utf8");
          document.getElementById("app").innerHTML = `<p class=\"text\">${options.lang.sxos.licensetext}<br>${save}</p>`;
        }
      }
    });
  }
}
module.exports = SXOS;
