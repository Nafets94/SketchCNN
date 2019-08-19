// Using fabric.js for canvas
var canvas = new fabric.Canvas('canvas');
window._canvas = canvas;
canvas.isDrawingMode = true;
canvas.backgroundColor = "#ffffff";
canvas.freeDrawingBrush.color = "#000000";
canvas.freeDrawingBrush.width = 8;
canvas.renderAll();

var canvasCoordonatesX = new Array();
var canvasCoordonatesY = new Array();

var startRecording = false;

var mychart;

canvas.on('mouse:down', function(options) {
  startRecording = true;
  pushMouseCoords(event);
})

canvas.on('mouse:move', function(options) {
  if (startRecording == true)
    pushMouseCoords(event);
});

canvas.on('mouse:up', function(options) {
  startRecording = false;
})

function pushMouseCoords(event)
{
  var pointer = canvas.getPointer(event.e);
  var positionX = Math.floor(pointer.x);
  var positionY = Math.floor(pointer.y);
  canvasCoordonatesX.push(positionX)
  canvasCoordonatesY.push(positionY)
  console.log(positionX+", "+positionY); // check how it records
}

function boundingBoxCoords()
{
  var dict = {};
  dict['top_left_corner_x'] = Math.min(...canvasCoordonatesX);
  dict['top_left_corner_y'] = Math.min(...canvasCoordonatesY);
  dict['bottom_right_corner_x'] = Math.max(...canvasCoordonatesX);
  dict['bottom_right_corner_y'] = Math.max(...canvasCoordonatesY);
  return dict;
}

// Clear canvas on "Clear" button press
$("#clear").click(function(){ 
  canvasCoordonatesX = [];
  canvasCoordonatesY = [];
  canvas.clear(); 
  canvas.backgroundColor = "#ffffff";
  canvas.renderAll();
  window.bar.destroy();
  hidepredictions()
});

// Predicting classes on "Predict" button press
$("#predict").click(function(){
  //Check needed to see if canvas is not empty
  if (canvasCoordonatesX.length == 0)
    return;

  //Get the ImageData
  const dict = boundingBoxCoords()
  console.log(dict)
  const imageDataUInt8 = canvas.contextContainer.getImageData(
    dict['top_left_corner_x'] * window.devicePixelRatio,
    dict['top_left_corner_y'] * window.devicePixelRatio,
    (dict['bottom_right_corner_x'] - dict['top_left_corner_x']) * window.devicePixelRatio,
    (dict['bottom_right_corner_y'] - dict['top_left_corner_y']) * window.devicePixelRatio);

  const inputData = tf.tidy(() => {
    const tensor = tf.browser.fromPixels(imageDataUInt8, numChannels = 1);
    const rsTensor = tf.image.resizeBilinear(tensor, [28, 28]).toFloat();

    const temp = rsTensor.div(tf.scalar(255.0))
    const normalized = tf.scalar(1.0).sub(temp);

    const batchDims = normalized.expandDims(0);
    return batchDims
  })

  //prediction from loaded model
  const pred = model.predict(inputData).dataSync()
  console.log("pred");
  console.log(pred);
  createDictionary(pred);
})

function createDictionary(pred){
  var class_array = classes.split("\n");
  console.log(class_array);

  var dict = {}; //it's an object, not a dictionary; objects can't be ordered in js
  class_array.forEach((key, i) => dict[key] = pred[i]);
  console.log(dict);

  var items = Object.keys(dict).map(function(key) {
    return [key, dict[key]];
  });

  items.sort(function(first, second) {
    return second[1] - first[1];
  });

  console.log(items.slice(0, 5));
  console.log(items[0][1])
  displayValues(items);
}

function displayValues(items){
  total = roundToTwo(100*items[0][1]+100*items[1][1]+100*items[2][1]+100*items[3][1]+100*items[4][1])
  var ctx = document.getElementById('myChart').getContext('2d');
  if(window.bar != undefined) 
    window.bar.destroy(); 
  window.bar = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [items[0][0], items[1][0], items[2][0], items[3][0], items[4][0]],
        datasets: [{
            label: '# of Votes',
            data: [roundToTwo(100*roundToTwo(100*items[0][1])/total),
                  roundToTwo(100*roundToTwo(100*items[1][1])/total),
                  roundToTwo(100*roundToTwo(100*items[2][1])/total),
                  roundToTwo(100*roundToTwo(100*items[3][1])/total),
                  roundToTwo(100*roundToTwo(100*items[4][1])/total)],
            backgroundColor: [
              'rgba(32,94,219,0.2)',
              'rgba(247,13,106,0.2)',
              'rgba(154,233,1,0.2)',
              'rgba(247,184,83,0.2)',
              'rgba(105,236,112,0.2)'
          ],
            borderWidth: 1
        }]
    },
    options: {
        responsive: false,
        maintainAspectRatio: true,
        legend: {
          display: false
      },
        tooltips: {
          enabled: false
      },
        scales: {
            xAxes: [{
              gridLines: {
                  color: "rgba(0, 0, 0, 0)",
              },
              ticks: {
                display: false
              }
          }],
            yAxes: [{
              gridLines: {
                  color: "rgba(0, 0, 0, 0)",
              },
              ticks: {
                display: false
              }   
          }]
        }
    }
});
  
  
  document.getElementById('prediction1').innerHTML = items[0][0] + ": " + roundToTwo(100*roundToTwo(100*items[0][1])/total) + "%";
  document.getElementById('prediction2').innerHTML = items[1][0] + ": " + roundToTwo(100*roundToTwo(100*items[1][1])/total) + "%";
  document.getElementById('prediction3').innerHTML = items[2][0] + ": " + roundToTwo(100*roundToTwo(100*items[2][1])/total) + "%";
  document.getElementById('prediction4').innerHTML = items[3][0] + ": " + roundToTwo(100*roundToTwo(100*items[3][1])/total) + "%";
  document.getElementById('prediction5').innerHTML = items[4][0] + ": " + roundToTwo(100*roundToTwo(100*items[4][1])/total) + "%";
  showpredictions();
}

function roundToTwo(num) {    
  return +(Math.round(num + "e+2")  + "e-2");
}