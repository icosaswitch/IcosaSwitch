class Settings {
  constructor(){
    $("#return").click(() => {
      load("home");
    });
    $("#en").click(() => {
      options.setLang("en");
      document.getElementsByClassName("atitle")[0].innerHTML = "Settings";
      document.getElementById("lang").innerHTML = "Language";
      document.getElementById("en").setAttribute("style", "background-color: #707070");
      document.getElementById("fr").setAttribute("style", "background-color: #505050");
    });
    $("#fr").click(() => {
      options.setLang("fr");
      document.getElementsByClassName("atitle")[0].innerHTML = "Paramètres";
      document.getElementById("lang").innerHTML = "Langue";
      document.getElementById("en").setAttribute("style", "background-color: #505050");
      document.getElementById("fr").setAttribute("style", "background-color: #707070");
    });
  }
}
module.exports = Settings;
