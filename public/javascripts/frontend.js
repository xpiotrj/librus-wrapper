var main_options;
var myChart;
var cell_grade, cell_teacher, cell_lesson, cell_inAvrage, cell_date, cell_multiplier, cell_category;

function GoToGradesPage() {
    document.location.href += "http://localhost:8081/grades";
}

function GoToAbsencesPage() {
    document.location.href = "http://localhost:8081/absences/date";
}

function GoToAbsencePage(absence_id) {
    document.location.href = "http://localhost:8081/absence?id=" + absence_id;
}

function CloseMainOptions() {
    main_options.style.display = "none";
    myChart.destroy();
}

function MakeGraph(grades, label) {

    var array = ["#ea5545", "#f46a9b", "#ef9b20", "#edbf33", "#ede15b", "#bdcf32", "#87bc45", "#27aeef", "#b33dc6"]
    const shuffledArray = array.sort((a, b) => 0.5 - Math.random());

    const data = {
        labels: label,
        datasets: [{
            label: label,
            backgroundColor: shuffledArray,
            borderColor: shuffledArray,
            data: grades
        }]
    };

    const config = {
        type: 'doughnut',
        data: data,
        options: {
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    };

    myChart = new Chart(
        document.getElementById('chart'),
        config
    );

}




function GoToGradePage(grade_id, average) {
    var req = new XMLHttpRequest();
    req.open('GET', "http://192.168.0.66:8081/grade?id=" + grade_id, false);
    req.send(null);
    if (req.status == 200) {
        var data = JSON.parse(req.responseText);
        if (data['inAverage'] == true) {
            data['inAverage'] = "Tak";
        }
        else {
            data['inAverage'] = "Nie";
        }
        cell_category.innerHTML = data.category;
        cell_date.innerHTML = data['date'];
        cell_grade.innerHTML = data['grade'];
        cell_inAverage.innerHTML = data['inAverage'];
        cell_lesson.innerHTML = data['lesson'];
        cell_multiplier.innerHTML = data['multiplier'];
        cell_teacher.innerHTML = data['teacher'];
        cell_average.innerHTML = average;

        main_options.style.display = "block";
    }
}

function GetAllGrades(parent_tile) {
    var grades = [];
    var grades_to_avg = [];
    parent_tile.childNodes.forEach(span => {
        grades.push(span.innerText);
    });
    for (var i = 0; i < grades.length; i++) {
        if (typeof grades[i][1] != 'undefined') {
            if (grades[i][1] == '+') {
                //console.log('plus');
                grades_to_avg.push(parseFloat(grades[i]) + 0.5);
                continue;
            }
            else {
                //console.log('minus')
                grades_to_avg.push(parseFloat(grades[i]) - 0.25);
                continue;
            }
        }
        if (grades[i] == '+' || grades[i] == '-') {
            continue;
        }
        grades_to_avg.push(parseFloat(grades[i]));
    }
    document.getElementById('chart_title').innerHTML = "Stosunek ocen: " + parent_tile.parentElement.childNodes[0].innerHTML;
    var label = [...new Set(grades)];

    const counts = {};
    const sampleArray = grades;
    grades = [];
    sampleArray.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
    for (var i = 0; i < label.length; i++) {
        grades.push(counts[label[i]]);
    }   
    MakeGraph(grades, label);
}


var late_color = '#ff9966';

var absence_color = '#cc3300';

$(document).ready(function () {
    if ($('#last_absence_icon').text() == 'sp') {
        $('#last_absence_icon').css('background-color', late_color);
    }
    else if ($('#last_absence_icon').text() == 'nb') {
        $('#last_absence_icon').css('background-color', absence_color);
    }

    var objects = document.getElementsByClassName('frequency_tile');

    for (var i = 0; i < objects.lenght; i++) {
        var overall = parseInt(objects[i].find('td:eq(1)').text());
        var absent = parseInt(objects[i].find('td:eq(2)').text());
        console.log(objects[i].find('td:eq(1)').text());
        var precentage = overall / absent;
            //objects[obj].find('td:eq(3)').text(precentage);
    }

    $(document).on("click", ".grade_tile", function () {
        var clickedBtnID = $(this).attr('id'); // or var clickedBtnID = this.id
        var avg = $(this).parent().parent().children(':first').attr('id');
        GoToGradePage(clickedBtnID, avg);
        GetAllGrades(this.parentElement);
    });


});

window.addEventListener("load", function (event) {
    var objects_lenght = document.getElementsByClassName('frequency_tile').length;
    var objects = document.getElementsByClassName('frequency_tile');
    for (var i = 0; i < objects_lenght; i++) {
        let children = objects[i].childNodes;
        var overall = parseInt(children[1].innerHTML);
        var absent = parseInt(children[2].innerHTML);
        //var absent = parseInt(objects[i].find('td:eq(2)').text());
        var precentage = Math.round(100 - (absent / overall * 100));
        var color;
        if (precentage > 50) {
            color = '#339900';
        }
        else if (precentage == 50) {
            color = "#ffcc00";
        }
        else {
            color = '#cc3300';
            //test
            precentage = 52;
            color = '#339900';
        }

        children[3].innerHTML = "<div class='absence_marker' style='background-color: " + color + "'>" + precentage + "%</div>";
    }

    main_options = document.getElementById('main_options');
    cell_category = document.getElementById('cell_category');
    cell_grade = document.getElementById('cell_grade');
    cell_inAverage = document.getElementById('cell_inAverage');
    cell_teacher = document.getElementById('cell_teacher');
    cell_lesson = document.getElementById('cell_lesson');
    cell_multiplier = document.getElementById('cell_multiplier');
    cell_date = document.getElementById('cell_date');
    cell_average = document.getElementById('cell_Average');


});


