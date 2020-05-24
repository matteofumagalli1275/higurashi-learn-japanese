const fs = require('fs');
var files = [
    'onikakushi',
    'watanagashi',
    'tatarigoroshi',
    'himatsubushi'
]
var games = []

for (let gameName of files) {
    const game = {
        name: gameName,
        files: []
    }
    var scriptPath = `./external/${gameName}/Update/`
    var files = fs.readdirSync(scriptPath);
    for(let file of files)  {
        var newFilename = txtToJson(game.name, scriptPath + file)
        game.files.push(newFilename)
    }
    games.push(game)
}

fs.writeFileSync("./src/games.json", JSON.stringify(games))

function txtToJson(gameName, file) {
    console.log(file)
    var text = fs.readFileSync(file).toString();
    function newScriptTemplate() {
        return {color: "#ffffff", labelEn: "Narrator", labelJp: "", textJp: [], textEn: []}
    }

	//This regex gets all strings parameters inside OutputLineAll and OutputLine functions
    var itemMatch = text.matchAll(/(OutputLineAll|OutputLine)\(.*?\"([\s\S]*?)\"[\s\S]*?(?:(?=\".*?\")\"(.*)\".*,|(?!\".*?\");)/gm)
    var scriptIndex = 0
    var scriptObj = [newScriptTemplate()]
    var count = 0
    var lastSentence = ""
    for(let result of itemMatch) {
        var func = result[1]
        var param1 = "";
        var param2 = "";

        if(result.length > 2 && result[2] !== undefined && result[2] !== null) {
            param1 = result[2].replace(/\\"/g,"\"").trim()
        }
        if(result.length > 3 && result[3] !== undefined && result[3] !== null) {
            param2 = result[3].replace(/\\"/g,"\"").trim()
        }
        
        if(func === "OutputLineAll") {
            if(param1 === "" && scriptObj[scriptIndex].labelJp !== "") {
                // Reset to narrator
                scriptIndex++
                scriptObj[scriptIndex] = newScriptTemplate()
            }
        }
        if(func === "OutputLine") {
            
            if(param1.startsWith("<color=")) {
                if(scriptObj[scriptIndex].textJp !== "") {
                    scriptIndex++
                }
                scriptObj[scriptIndex] = newScriptTemplate()
                try {
                    scriptObj[scriptIndex].color = param1.match(/#[0-9a-fA-F]*/)[0]
                    scriptObj[scriptIndex].labelJp = param1.match(/(?<=<color=.*>)(.*?)(?=<\/color>)/)[0]
                    scriptObj[scriptIndex].labelEn = param2.match(/(?<=<color=.*>)(.*?)(?=<\/color>)/)[0]
                } catch(e) {
                    //Match failed, leave template
                    console.log("Some scripts may be broken due to miss a color or english char name. Leave it be...")
                    console.log("Error at: " + lastSentence)
                    console.warn(e)
                }

            } else {
                lastSentence = param2
                scriptObj[scriptIndex].textJp.push(param1);
                scriptObj[scriptIndex].textEn.push(param2);
            }
        }
    }


    var newFilename = file.match(/^.*?([^\\\/]*)\.txt$/)[1]
    fs.mkdirSync(`scripts/${gameName}/`, { recursive: true })
    fs.writeFileSync(`scripts/${gameName}/${newFilename}.json`, JSON.stringify(scriptObj,null,2))

    return newFilename
}