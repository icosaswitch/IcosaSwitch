class NSCB {
  constructor(){
    NSCB.nscb();
  }

  static async nscb(){
    $("#return").click(() => {
      load("home");
    });
    if(!fs.existsSync(path.join(root, "nscbuilder"))){
      document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.download+"...</p>";
      const res = await fetch('https://github.com/IcosaSwitch/IcosaSwitch/releases/download/files/nscbuilder.icsa');
      let result;
      await new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(path.join(root, "nscbuilder.icsa"));
        res.body.pipe(fileStream);
        res.body.on("error", (err) => {
          result = err;
          reject();
        });
        fileStream.on("finish", function() {
          result = "success"
          resolve();
        });
      });
      if(result == "success"){
        await writeICSADir(await readICSAFile(path.join(root, "nscbuilder.icsa")), path.join(root, "nscbuilder"));
        fs.unlinkSync(path.join(root, "nscbuilder.icsa"))
      } else {
        return document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.error+": "+result+"</p>";
      }
    }
    exec("start C:\\Windows\\system32\\cmd.exe /c\"" + path.join(root, "nscbuilder", "NSCB.bat") + "\"", {
      cwd: path.join(root, "nscbuilder"),
      localDir: path.join(root, "nscbuilder"),
      encoding: "utf8"
    });

    document.getElementById("app").innerHTML = "<p class=\"text\">"+options.lang.nscbuilder.success+"</p>";
  }
}
module.exports = NSCB;
