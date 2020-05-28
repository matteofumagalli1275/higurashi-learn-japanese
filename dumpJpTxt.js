const fs = require('fs');


var scriptPath = `./scripts`
var scriptPathDest = `./scripts_txt`
var games = fs.readdirSync(scriptPath)

for (let game of games) {
    var scripts = fs.readdirSync(scriptPath + "/" + game)
    var gameText = ""
    for (let script of scripts) {
        if (script.endsWith(".json")) {
            var data = fs.readFileSync(scriptPath + "/" + game + "/" + script)
            var obj = JSON.parse(data)
            var fullText = ""
            for (let dialog of obj) {
                const text = dialog.textJp.join() + "\n"
                fullText += text

            }
            scriptName = script.replace(/\.[^/.]+$/, "")
            fs.mkdirSync(`${scriptPathDest}/${game}/`, { recursive: true })
            fs.writeFileSync(`${scriptPathDest}/${game}/${game}_${scriptName}.txt`, fullText)
            gameText += fullText
        }
    }
    fs.mkdirSync(`${scriptPathDest}`, { recursive: true })
    fs.writeFileSync(scriptPathDest + "/" + game + ".txt", gameText)
} 