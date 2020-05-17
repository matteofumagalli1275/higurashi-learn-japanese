var fs = require('fs');
const path = require("path");

var games = []
var scriptFolder = "./external/onikakushi/Update/"
var files = fs.readdirSync(scriptFolder);

for(let file of files)  {
    txtToJson(scriptFolder + file)
}

files.forEach((file, index) => {
    var newFilename = file.match(/^.*?([^\\\/]*)\.txt$/)[1]
    files[index] = newFilename
});
games.push({ game: 'onikakushi', files: files })
fs.writeFileSync("./src/games.json", JSON.stringify(games))


function parsFuncParams(paramStr) {
    var QuoteFlag = true
    var curStr = 0
    var paramList = []
    for(var i=0; i < paramStr.length; i++) {
        if(paramStr[i] === ',' && QuoteFlag == true) {
            var newP = paramStr.substring(curStr, i).trim()
            paramList.push(newP)
            curStr = i + 1
        }
        if(paramStr[i] === '"' && (i <= 0 || paramStr[i-1] !== '\\')) {
            QuoteFlag = !QuoteFlag
        }
    }
    return paramList
}

function txtToJson(file) {
    console.log(file)
    var text = fs.readFileSync(file).toString();
    function newScriptTemplate() {
        return {color: "#ffffff", labelEn: "", labelJp: "", textJp: [], textEn: []}
    }
    var itemMatch = text.matchAll(/(OutputLineAll|OutputLine)\(([\S\s]*?)\);/gm)
    var scriptIndex = 0
    var scriptObj = [newScriptTemplate()]
    var count = 0

    for(let result of itemMatch) {
        var func = result[1]
        var params = parsFuncParams(result[2])
        if(func === "OutputLineAll") {
            // Does not seem important to keep newlines, do nothing
            //var countlines = 0;
            //countlines += params[0].split('\\n').length - 1
            //countlines += params[1].split('\\n').length - 1
            //scriptObj[scriptIndex].textJp.push('/n'.repeat(countlines))
            //scriptObj[scriptIndex].textEn.push('/n'.repeat(countlines))
        }
        if(func === "OutputLine") {
            if(params[0] !== "NULL" && params[2] !== "NULL") {
                scriptIndex++
                scriptObj[scriptIndex] = newScriptTemplate()
                try {
                    scriptObj[scriptIndex].color = params[0].match(/#[0-9a-fA-F]*/)[0]
                    scriptObj[scriptIndex].labelJp = params[0].match(/(?<=<color=.*>)(.*?)(?=<\/color>)/)[0]
                    scriptObj[scriptIndex].labelEn = params[2].match(/(?<=<color=.*>)(.*?)(?=<\/color>)/)[0]
                } catch(e) {
                    //Match failed, leave template
                }

            } else if(params[1] !== "NULL" && params[3] !== "NULL") {
                scriptObj[scriptIndex].textJp.push(params[1].replace(/\\"/g,"\"").replace(/^"(.*)"$/, '$1').trim());
                scriptObj[scriptIndex].textEn.push(params[3].replace(/\\"/g,"\"").replace(/^"(.*)"$/, '$1').trim());
            }
        }
    }


    var newFilename = file.match(/^.*?([^\\\/]*)\.txt$/)[1]
    fs.mkdirSync('scripts/', { recursive: true })
    fs.writeFileSync('scripts/' + newFilename + ".json", JSON.stringify(scriptObj,null,2))


}