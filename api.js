
const Librus = require("librus-api");

let client = new Librus();

client.authorize("7637144u", "Marlena2015!");


function getSubjectsFormated() {
    var table = '<table><tr>';
    client.homework.listSubjects().then(data => {
        for (var i = 0; i < data.length; i++) {
            table += "<th>" + data[i]['name'] + "</th>";
        }
        table += "</tr></table>";
        delete data[0]['name'];
    });
    return data;
};

export { getSubjectsFormated };