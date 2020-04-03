class Credits {
  constructor(){
    let credits = [
      "https://github.com/Atmosphere-NX/Atmosphere",
      "https://github.com/shchmue/Lockpick_RCM",
      "https://github.com/jimzrt/Incognito_RCM",
      "https://github.com/rajkosto/TegraRcmSmash",
      "https://github.com/Qyriad/fusee-launcher",
      "https://github.com/julesontheroad/NSC_BUILDER",
      "https://github.com/rajkosto/biskeydump",
      "https://github.com/vgmoose/hb-appstore",
      ["https://switchbru.com/appstore", "https://switchbru.com/appstore (Pwsincd, Vgmoose, Roman, Jaames)"],
      "https://yuzu-emu.org"
    ]

    $(".link").html(credits.map((val, n) => {
      let a;
      if(typeof val == "string"){
        a = `<a href="${val}">${val}</a>`;
      } else {
        a = `<a href="${val[0]}">${val[1]}</a>`
      }
      if(n === (credits.length-1)){
        return a
      } else {
        return a+"<br>";
      }
    }).join(""));

    $(document).on('click', 'a[href^="http"]', function(event) {
        event.preventDefault();
        shell.openExternal(this.href);
    });

    $("#return").click(() => {
      load("home");
    });
  }
}
module.exports = Credits;
