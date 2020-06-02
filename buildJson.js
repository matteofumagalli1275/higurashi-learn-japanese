const fs = require('fs');
var mainScriptFilter = /^onik.*$|^wata.*$|^tata.*$|^hima.*$|^omake.*$/
const supportedGames = [
    {name: 'onikakushi'},
    {name: 'watanagashi'},
    {name: 'tatarigoroshi'},
    {name: 'himatsubushi'},
]
var games = []

for (let supportedGame of supportedGames) {
    var scriptPath = `./external/${supportedGame.name}/Update/`
    var files = fs.readdirSync(scriptPath);

    files = files.filter(file => file.match(mainScriptFilter) && !file.match("vm00|vm0x"))
    if(files.length > 0) {
        const entry = {
            name: supportedGame.name,
            files: []
        }
        fs.mkdirSync(`scripts/${entry.name}/`, { recursive: true })
        for(let file of files)  {
            const fileNoExt = file.replace(/\.[^/.]+$/, "")
            var scriptName = ""
            var priority = 1
            if(fileNoExt.endsWith("_op")) {
                scriptName = "Intro"
                priority = 10
            } else if(fileNoExt.endsWith("_badend")) {
                scriptName = "Bad end"
                priority = 4
            } else {
                var matchChNum = file.match(/.*?(\d+)(?:\_(\d+))?/)
                if(matchChNum.length >= 2) {
                    var ch = ""
                    if(matchChNum.length == 3 && matchChNum[2] !== undefined)
                        ch = parseInt(matchChNum[1]) + " part " + parseInt(matchChNum[2])
                    else
                        ch = parseInt(matchChNum[1])

                    if(file.startsWith("omake")) {
                        scriptName = "Omake " + ch
                        priority = 0
                    } else if(file.indexOf("_tips") >= 0) {
                        scriptName = "Tip " + ch
                        priority = 3
                    } else if(file.indexOf("_ep") >= 0) {
                        scriptName = "Epilogue " + ch
                        priority = 2
                    } 
                    else {
                        scriptName = "Day " + ch
                        priority = 5
                    }
                }
            }

            var scriptObj = []
            scriptObj = txtToJson(scriptObj, entry.name, scriptPath,  file, null)

            const newFilename = scriptName.replace(/\ /g, '_') + '.json'
            fs.writeFileSync(`scripts/${entry.name}/${newFilename}`, JSON.stringify(scriptObj,null,2))
            entry.files.push({ name: scriptName, file: newFilename, priority: priority})
        }
        entry.files.sort((a,b) => (a.priority < b.priority) ? 1 : ((b.priority < a.priority) ? -1 : 0))
        entry.files.forEach(file => delete file.priority);

        //console.log(entry)
        games.push(entry)
    }
    
}

fs.writeFileSync("./src/games.json", JSON.stringify(games))

function txtToJson(scriptObj, gameName, scriptPath, filename, filterFunc) {
    function newScriptTemplate() {
        return {color: "#ffffff", labelEn: "Narrator", labelJp: "", textJp: [], textEn: []}
    }

    var allowExternalScript = true //Temporary workaround to get only one censor script version
    var file = scriptPath + filename
    var text = fs.readFileSync(file).toString();
    if(filterFunc !== null) {
        text = getFuncBody(text, filterFunc)
    }
	//This regex gets all strings parameters inside OutputLineAll and OutputLine functions
    var itemMatch = text.matchAll(/(OutputLineAll|OutputLine|ModCallScriptSection)\(.*?\"([\s\S]*?)\"[\s\S]*?(?:(?=\".*?\")\"(.*)\".*,|(?!\".*?\");)/gm)
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
        
        switch(func) {
            case "OutputLineAll":
                allowExternalScript = true
                if(param1 === "" && (scriptObj.length <= 0 || scriptObj[scriptObj.length - 1].labelJp !== "")) {
                    // Reset to narrator
                    scriptObj.push(newScriptTemplate())
                }
                break
            case "OutputLine":
                allowExternalScript = true
                if(param1.startsWith("<color=")) {
                    // Add a new entry only if there was test in last dialog
                    if(scriptObj.length <= 0 || scriptObj[scriptObj.length - 1].textJp.length > 0) {
                        scriptObj.push(newScriptTemplate())
                    }
                    const scriptIndex = scriptObj.length - 1
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
                    if(scriptObj.length <= 0) {
                        scriptObj.push(newScriptTemplate())
                    }
                    const scriptIndex = scriptObj.length - 1
                    scriptObj[scriptIndex].textJp.push(param1);
                    scriptObj[scriptIndex].textEn.push(param2);
                }
                break
            case "ModCallScriptSection":
                if(allowExternalScript) {
                    var callscriptParams = result[0].match(/\"(.*?)\".*?\"(.*?)\"/)
                    scriptObj = txtToJson(scriptObj, gameName, scriptPath, callscriptParams[1] + ".txt", callscriptParams[2])
                    allowExternalScript = false
                }
                break
        }

    }

    return scriptObj
}

function getFuncBody(text, funcname) {
    
    //[\s\S]*?(void|$(?![\r\n]))
    var re = new RegExp(funcname + "[\\s\\S]*?(void|$(?![\\r\\n]))", "gm");
    var result = text.match(re)

    if(result !== null) {
        return result[0]
    } else {
        console.warn("Function " + funcname + " not found")
        return ""
    }
}