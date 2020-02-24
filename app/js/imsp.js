class IsMySwitchPatched {
  constructor(){
    IsMySwitchPatched.init();
  }

  static async init(){
    $("#return").click(() => {
      load("home");
    });
    let serial,prefix,number;
    function safeResult() {
      document.getElementById("ispatch").innerHTML = options.lang.imsp.unpatched;
      document.getElementById("ispatch").setAttribute("style", "color: #7cfc00;");
    }
    function possiblyPatchedResult() {
      document.getElementById("ispatch").innerHTML = options.lang.imsp.possibly;
      document.getElementById("ispatch").setAttribute("style", "color: #ffa500;");
    }
    function patchedResult() {
      document.getElementById("ispatch").innerHTML = options.lang.imsp.patched;
      document.getElementById("ispatch").setAttribute("style", "color: #ff4500;");
    }
    function unknownResult(){
      document.getElementById("ispatch").innerHTML = options.lang.imsp.unknown;
      document.getElementById("ispatch").setAttribute("style", "color: #f5f6fa;");
    }
    $("#serial").on("change paste keyup", function() {
      serial = $("#serial").val();
      serial = serial.toUpperCase()
      $("#serial").val(serial);
      if(serial.length > 14){
        serial = serial.substring(0, 14);
        $("#serial").val(serial);
      }
      if(serial === ""){
        return document.getElementById("ispatch").innerHTML = "";
      } else if(!new RegExp(/[X][A-Z]{2}[0-9]{7,11}/g).test(serial)){
        document.getElementById("ispatch").innerHTML = options.lang.imsp.not;
        document.getElementById("ispatch").setAttribute("style", "color: #f5f6fa;");
        return
      } else {
        document.getElementById("ispatch").innerHTML = "";
      }
      prefix = serial.substring(0, 4);
      number = parseInt(serial.substring(4, 10));
      if(prefix.startsWith("XKW") || prefix.startsWith("XKJ")){
        return patchedResult();
      } else if(prefix.startsWith("XAK")){
        return possiblyPatchedResult();
      }
      switch(prefix){
        case "XAW1": {
          if(number <= 7499){
            safeResult();
          } else if(number >= 7500 && number <= 12000){
            possiblyPatchedResult();
          } else {
            patchedResult();
          }
          break;
        }
        case "XAW4": {
          if(number <= 1100){
            safeResult();
          } else if(number > 1100 && number <= 1200){
            possiblyPatchedResult();
          } else {
            patchedResult();
          }
          break;
        }
        case "XAW7": {
          if(number <= 1780){
            safeResult();
          } else if(number > 1780 && number <= 3000){
            possiblyPatchedResult();
          } else {
            patchedResult();
          }
          break;
        }
        case "XAJ1": {
          if(number <= 2000){
            safeResult();
          } else if(number > 2000 && number <= 3000){
            possiblyPatchedResult();
          } else {
            patchedResult();
          }
          break;
        }
        case "XAJ4": {
          if(number <= 4600){
            safeResult();
          } else if(number > 4600 && number <= 8300){
            possiblyPatchedResult();
          } else {
            patchedResult();
          }
          break;
        }
        case "XAJ7": {
          if(number <= 4000){
            safeResult();
          } else if(number > 4000 && number <= 5000){
            possiblyPatchedResult();
          } else {
            patchedResult();
          }
          break;
        }
        case "XAW9": {
          patchedResult();
          break;
        }
        default: {
          unknownResult();
        }
      }
    });
  }
}
module.exports = IsMySwitchPatched;
