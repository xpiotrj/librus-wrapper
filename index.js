const { count } = require('console');
var express = require('express');
const Librus = require("librus-api");
var app = express();
const path = require("path");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, 'public')));


let client = new Librus();

client.authorize("7637144u", "Marlena2015!");



app.get('/', function (req, res) {
    //get user data
    var studnetInfo;
    var today = new Date();
    var gradesData;
    var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    var timetable = [];

    client.info.getAccountInfo().then(data => {
        studentInfo = data['student'];
    });

    client.info.getGrades().then(data => {
        for (var i = 0; i < data.length; i++) {
            if (typeof data[i]['semester'][0]['grades'][0] == "undefined") {
                data[i]['semester'][0]['grades'][0] = ' ';
            }
        }

        gradesData = data;
    });

    var absence_byDate = [];
    var type = [];
    var temp = [];
    var lastAbsence = [];
    var lastAnnon = '';

    client.absence.getAbsences().then(data => {
        for (var i = 0; i < data['0'].length; i++) {
            for (var x = 0; x < Object.keys(data['0'][i]['table']).length; x++) {
                if (data['0'][i]['table'][x] != null) {
                    absence_byDate.push({ date: data['0'][i]['date'], grade_id: data['0'][i]['table'][x].id });
                    type.push(data['0'][i]['table'][x].type);
                }

            }
        }
        //console.log(absence_byDate[1]['grade_id']);
        const absence_byDateOrganised = absence_byDate.reduce((acc, value) => {
            // Group initialization
            if (!acc[value.date]) {
                acc[value.date] = [];
            }

            // Grouping
            acc[value.date].push(value.grade_id);

            return acc;
        }, {});


        for (element in absence_byDateOrganised) {
            temp.push([element, absence_byDateOrganised[element]]);
        }

        var a = 0;
        for (element in temp) {
            var obj = [];
            for (var i = 0; i < Object.keys(temp[element][1]).length; i++) {
                obj.push(type[a]);
                a++;
            }
            temp[element].push(obj);
            obj = [];
        }


        //connect with main page calendar 
        client.calendar.getCalendar().then(data => {
            for (var i = today.getDate(); i < data.length; i++) {
                if (data[i] != '') {
                    lastAnnon += data[i][0]['day'] + " " + data[i][0]['title']
                    //console.log(data[i][0]);
                    return;
                }
            }
            lastAnnon = 'brak nadchodzących wydarzeń';

        });

        var weekLessons = [];

        client.calendar.getTimetable().then(data => {
            for (var a = 0; a < 10; a++) {
                var day = [];
                day.push(data['hours'][a]);
                for (var i = 0; i < 5; i++) {
                    if (data['table'][days[i]][a] != null) {
                        day.push(data['table'][days[i]][a]['title'].split('\n')[0]);
                        weekLessons.push(data['table'][days[i]][a]['title'].split('\n')[0]);
                        
                    }
                    else {
                        day.push('-');
                    }
                }
                timetable.push(day);
            }

            var nonCountableHours = [];
            var today = new Date();
            var totalHours = 0;
            var absenceHours = [];

            for (var i = 2; i <= today.getMonth() + 1; i++) {
                client.calendar.getCalendar(i).then(data => {
                    for (var a = 0; a < data.length; a++) {
                        if (typeof data[a][0] != 'undefined') {
                            if (data[a][0]['title'].startsWith('Odwo') == true) {
                                var subject = data[a][0]['title'].substring(
                                    data[a][0]['title'].indexOf("(") + 1,
                                    data[a][0]['title'].lastIndexOf(")")
                                );
                                nonCountableHours.push(subject);
                                //console.log(subject); //<- list of non-countable hours
                            }
                        }
                    }
                    

                });

            }

            client.absence.getAbsence(temp[0][1][0]).then(data => {
                lastAbsence.push(data['date'], data['subject'], temp[0][2][0]);
            });


            //timetable - [7:30-8:00, -, wiai, -, - ,-], [8:00-8:45, mat, asbd, mat, wf, niem] itd...
            client.info.getGrades().then(data => {
                var map = weekLessons.reduce(function (prev, cur) {
                    prev[String(cur)] = (prev[cur] || 0) + 1;
                    return prev;
                }, {});
                weekLessons = [];
                for (var property in map) {
                    weekLessons.push([property, (map[property] * 8), 0])
                    //absenceHours.push([property, 0])
                }
                //console.log(absenceHours);

                for (var i = 0; i < absence_byDate.length; i++) {
                    client.absence.getAbsence(absence_byDate[i]['grade_id']).then(data => {
                        //console.log(data);
                        if (data['type'].startsWith('nie') == true) { /// POPRAWIC NA START OD DANEJ DADY WZWYZ
                            let date = new Date(data['date'].split(' ')[0]);
                            let holiday_date = new Date('2022-02-14');
                            // console.log(date < holiday_date);
                            if (date < holiday_date) {
                                //console.log(date)
                                return;
                            }
                        }
                        else {
                            return;
                        }
                        for (var i = 0; i < weekLessons.length; i++) {
                            if (weekLessons[i][0] == data['subject']) {
                                weekLessons[i][2] += 1;
                                //console.log(weekLessons[i]);
                            }
                            
                        }
                        //console.log(weekLessons);
                    });
                    
                }
                


              for (var i = 0; i < nonCountableHours.length; i++) {
                    for (lesson in weekLessons) {
                        if (weekLessons[lesson][0] == nonCountableHours[i]) {
                            weekLessons[lesson][1] -= 1;
                        }

                  }
                  
                }
                //console.log(weekLessons);
                client.absence.getAbsence(temp[0][1][0]).then(data => {
                    res.render('index', { lastAnnon: lastAnnon, nameSurname: studentInfo.nameSurname, index: studentInfo.index, educator: studentInfo.educator, classes: studentInfo.class, subjects: gradesData, days: temp, timetable: timetable, lastAbsence: lastAbsence, frequency: weekLessons });
                });
            });
        });

       

    });
});

app.get('/grade', function (req, res) {
    var grade_id = req.query.id;
    client.info.getGrade(grade_id).then(data => {
        console.log(data['lesson']);
        res.send({ grade: data['grade'], category: data['category'], date: data['date'], lesson: data['lesson'], multiplier: data['multiplier'], teacher: data['teacher'], inAverage: data['inAverage'] });
    });

    //{"grade":"5+","category":"praca na lekcji","date":"2022-04-08 (pt.)","teacher":"Barbara Markowska","lesson":"J�zyk angielski zawodowy","inAverage":true,"multiplier":"2","user":"Markowska Barbara (Markowska Barbara) [Nauczyciel]","comment":"database"}
});


//grades page
app.get('/grades', function (req, res) {
    client.info.getGrades().then(data => {
        for (var i = 0; i < data.length; i++) {
            if (typeof data[i]['semester'][0]['grades'][0] == "undefined") {
                data[i]['semester'][0]['grades'][0] = ' ';
            }
        }
        res.render('grades', { subjects: data });
    });
});

app.get('/absences/date', function (req, res) {
    var absence_byDate = [];
    var type = [];

    var absence_bySubject = [];

    client.absence.getAbsences().then(data => {
        for (var i = 0; i < data['0'].length; i++) {
            for (var x = 0; x < Object.keys(data['0'][i]['table']).length; x++) {
                if (data['0'][i]['table'][x] != null) {
                    absence_byDate.push({ date: data['0'][i]['date'], grade_id: data['0'][i]['table'][x].id});
                    type.push(data['0'][i]['table'][x].type);
                }

            }
        }
        const absence_byDateOrganised = absence_byDate.reduce((acc, value) => {
            // Group initialization
            if (!acc[value.date]) {
                acc[value.date] = [];
            }

            // Grouping
            acc[value.date].push(value.grade_id);

            return acc;
        }, {});
        
        var temp = [];
        for (element in absence_byDateOrganised) {
            temp.push([element, absence_byDateOrganised[element]]);
        }

        var a = 0;
        for (element in temp) {
            var obj = [];
            for (var i = 0; i < Object.keys(temp[element][1]).length; i++) {
                obj.push(type[a]);
                a++;
            }
            temp[element].push(obj);
            obj = [];
        }
        res.render('absences_date', { days: temp });
    });
});

app.get('/absence', function (req, res) {
    var absence_id = req.query.id;
    client.absence.getAbsence(absence_id).then(data => {
        res.render('absence', { type: data['type'], subject: data['subject'], date: data['date'], lessonHour: data['lessonHour'], topic: data['topic'] });
    });

    //{"type":"nieobecno�� uspr.","date":"2022-03-14 (pon.)","subject":"Historia","topic":"7","lessonHour":"Rados�aw Margas","teacher":"Nie","trip":false}
});


var server = app.listen(8081, function () {
  
    console.log('listening 8081');
})