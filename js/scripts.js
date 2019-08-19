async function loadmodel() {
    model = await tf.loadLayersModel('modelgpu/model/model.json') // model
    model.predict(tf.zeros([1, 28, 28, 1]))
    document.getElementById('modelstatus').innerHTML = 'Model is ready &#x2705;';
    //await loadclasses()
}

async function loadclasses() {
    const fileUrl = 'modelgpu/model/categories.txt' // classes
    classes = await fetch(fileUrl).then( r => r.text() )
    document.getElementById('classesstatus').innerHTML = 'Classes are loaded &#x2705;';
}

function hidepredictions() {
    var q = document.getElementById("chartDiv");
    q.style.display = 'none';
    var x = document.getElementsByClassName("predictions");
    for (var i = 0; i < x.length; i ++) {
        x[i].style.display = 'none';
    }
}

function showpredictions() {
    var q = document.getElementById("chartDiv");
    q.style.display = 'block';
    var x = document.getElementsByClassName("predictions");
    for (var i = 0; i < x.length; i ++) {
        x[i].style.display = 'block';
    }
}

function hidekmeansfield(){
    var q = document.getElementById("KMeansParameter");
    q.style.display = 'none';
}

function showkmeansfield(){
    var q = document.getElementById("KMeansParameter");
    q.style.display = 'block';
}