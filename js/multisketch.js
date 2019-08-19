var canvas_multi_sketch = new fabric.Canvas('canvas_multi_sketch');
window._canvas = canvas_multi_sketch;
canvas_multi_sketch.isDrawingMode = true;
canvas_multi_sketch.backgroundColor = "#ffffff";
canvas_multi_sketch.freeDrawingBrush.color = "#000000";
canvas_multi_sketch.freeDrawingBrush.width = 7;
canvas_multi_sketch.renderAll();

var c = document.getElementById("canvas_multi_sketch");
var ctx = c.getContext("2d");

var boundingBoxesAlg = false;
var KmeansAlg = false;

var canvasCoordonatesX = new Array();
var canvasCoordonatesY = new Array();

var startRecording = false;

canvas_multi_sketch.on('mouse:down', function(options) {
  startRecording = true;
  pushMouseCoords(event);
})

canvas_multi_sketch.on('mouse:move', function(options) {
  if (startRecording == true)
    pushMouseCoords(event);
});

canvas_multi_sketch.on('mouse:up', function(options) {
  startRecording = false;
})

$("#boundingboxesalg").click(function(){
  boundingBoxesAlg = true;
  KmeansAlg = false;
  document.getElementById('modelselected').innerHTML = "Bounding Boxes Choosed"
  document.getElementById("modelselected").style.color = "black";
  hidekmeansfield();
});

$("#unsupervisedlearningalg").click(function(){
  boundingBoxesAlg = false;
  KmeansAlg = true;
  document.getElementById('modelselected').innerHTML = "Unsupervised Learning Choosed"
  document.getElementById("modelselected").style.color = "black";
  showkmeansfield();
});

function pushMouseCoords(event)
{
  var pointer = canvas_multi_sketch.getPointer(event.e);
  var positionX = Math.floor(pointer.x);
  var positionY = Math.floor(pointer.y);
  canvasCoordonatesX.push(positionX)
  canvasCoordonatesY.push(positionY)
  //console.log(positionX+", "+positionY); // check how it records
}

// Clear canvas on "Clear" button press
$("#clear").click(function(){ 
  ctx.beginPath();
  ctx.clearRect(0, 0, canvas_multi_sketch.width, canvas_multi_sketch.height);

  canvasCoordonatesX = [];
  canvasCoordonatesY = [];
  canvas_multi_sketch.clear(); 
  canvas_multi_sketch.backgroundColor = "#ffffff";
  canvas_multi_sketch.renderAll();
  
  hidepredictionsmulti()
});

$("#predictmulti").click(function(){
  if (canvasCoordonatesX.length == 0){
    document.getElementById('modelselected').innerHTML = "Canvas can't be empty";
    return;
  }

  if (boundingBoxesAlg === false && KmeansAlg === false){
      document.getElementById('modelselected').innerHTML = "Please choose an algorithm";
      document.getElementById("modelselected").style.color = "red";
      return;
  }

  if (boundingBoxesAlg === true)
      predictwithBBA();

  if (KmeansAlg === true)
      predictwithKMeans();
})

function predictwithBBA(){
  var listRectangles = [];
  var colorArray = ['#FFA500', '#8A2BE2', '#1E90FF', '#5F9EA0', '#FF7F50', '#DC143C', 
      '#FF8C00', '#556B2F', '#999966', '#008000', '#ADFF2F', '#FF69B4', '#4B0082',
      '#CD5C5C', '#F0E68C', '#9370DB', '#FAEBD7'];
  canvas_multi_sketch.forEachObject(function(obj) {
  var bound = obj.getBoundingRect();
    
  //Can be uncommented to show the bounding boxes of the strikes in the canvas
  /*canvas_multi_sketch.contextContainer.strokeRect(
    bound.left - 5,
    bound.top - 5,
    bound.width + 10,
    bound.height + 10
  );*/
  
  bound["top"] = bound.top - 5;
  bound["left"] = bound.left - 5;
  bound["width"] = bound.width + 10;
  bound["height"] = bound.height + 10;
      
  listRectangles.push(bound);
})

var boundingBoxes = [];

var collisionsArray = [];
//var rectangles = listRectangles;

for (rectangle of listRectangles) {
  var collisionsIndexes = [];

  i = 0;
  for (collisionElement of collisionsArray) 
  {
      for (rect of collisionElement) 
      {
          if (doRectsCollide(rect, rectangle) === true)
          {
              collisionsIndexes.push(i);
              break;
          }
      }
      i++;
  }

  if (collisionsIndexes.length === 0) {
      collisionsArray.push([rectangle])
  } else if (collisionsIndexes.length >= 1) {
      collisionsArray[collisionsIndexes[0]].push(rectangle)
      for (var i = 1; i < collisionsIndexes.length; i++)
      {
          var new_index = collisionsIndexes[i] - (i - 1);
          console.log("index");
          console.log(new_index + " " + collisionsIndexes[i] + " " + i);
          collisionsArray[collisionsIndexes[0]].push(...collisionsArray[new_index])
          collisionsArray.splice(new_index, 1);
      }
  }
}


for (collision of collisionsArray) {
  top_v = 1000;
  left_v = 1000;
  right_v = 0;
  down_v = 0;
  for(i=0;i<collision.length;i++){
      if(collision[i]["top"] < top_v)
          top_v = collision[i]["top"];
      if(collision[i]["left"] < left_v)
          left_v = collision[i]["left"];
      if(collision[i]["left"] + collision[i]["width"] > right_v)
          right_v = collision[i]["left"] + collision[i]["width"];
      if(collision[i]["top"] + collision[i]["height"] > down_v)
          down_v = collision[i]["top"] + collision[i]["height"]
  }
  let rect = {left: left_v, top:top_v, width:right_v-left_v, height:down_v-top_v};
  boundingBoxes.push(rect);
}

for(var k = 0;k<boundingBoxes.length;k++){
  console.log(boundingBoxes[k]);
  var lefta = boundingBoxes[k]["left"];
  var topa = boundingBoxes[k]["top"];
  var widtha = boundingBoxes[k]["width"];
  var heighta = boundingBoxes[k]["height"];

  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = colorArray[k];
  ctx.rect(lefta, topa, widtha, heighta);
  ctx.stroke();

  var imageDataUInt8 = canvas_multi_sketch.contextContainer.getImageData(
      lefta * window.devicePixelRatio,
      topa * window.devicePixelRatio,
      widtha * window.devicePixelRatio,
      heighta * window.devicePixelRatio);

  var inputData = tf.tidy(() => {
      var tensor = tf.browser.fromPixels(imageDataUInt8, numChannels = 1);
      var rsTensor = tf.image.resizeBilinear(tensor, [28, 28]).toFloat();
  
      var temp = rsTensor.div(tf.scalar(255.0))
      var normalized = tf.scalar(1.0).sub(temp);
  
      var batchDims = normalized.expandDims(0);
      return batchDims
  })
  
  //prediction from loaded model
  var pred = model.predict(inputData).dataSync()
    createDictionary(pred,k,lefta,topa);
  }
}

function combineRects (rect1, rect2) {
  rect1left = rect1["left"];
  rect1top = rect1["top"];
  rect1width = rect1["width"];
  rect1height = rect1["height"];
  rect1right = rect1left + rect1width;
  rect1down = rect1top + rect1height;

  rect2left = rect2["left"];
  rect2top = rect2["top"];
  rect2width = rect2["width"];
  rect2height = rect2["height"];
  rect2right = rect2left + rect2width;
  rect2down = rect2top + rect2height;

  topv = Math.min(rect1top, rect2top);
  leftv = Math.min(rect1left, rect2left);

  downv = Math.max(rect1down, rect2down);
  rightv = Math.max(rect1right, rect2right);

  widthv = rightv - leftv;
  heightv = downv - topv;

  var rect3 = {top:topv, left:leftv, width:widthv, height:heightv};
  return rect3;
  //return a rectangle object representing the bounding box of the union of rect1 and rect2;
}

function doRectsCollide (rect1, rect2) {
  rect1left = rect1["left"];
  rect1top = rect1["top"];
  rect1width = rect1["width"];
  rect1height = rect1["height"];
  rect1right = rect1left + rect1width;
  rect1down = rect1top + rect1height;

  rect2left = rect2["left"];
  rect2top = rect2["top"];
  rect2width = rect2["width"];
  rect2height = rect2["height"];
  rect2right = rect2left + rect2width;
  rect2down = rect2top + rect2height;

  aLeftOfB = rect1right < rect2left;
  aRightOfB = rect1left > rect2right;
  aAboveB = rect1top > rect2down;
  aBelowB = rect1down < rect2top;

  return !( aLeftOfB || aRightOfB || aAboveB || aBelowB );

  //returns true if rects collide, otherwise false;
}

function createDictionary(pred,k,lefta,topa){
  var class_array = classes.split("\n");
  //console.log(class_array);

  var dict = {}; //it's an object, not a dictionary; objects can't be ordered in js
  class_array.forEach((key, i) => dict[key] = pred[i]);
  //console.log(dict);

  var items = Object.keys(dict).map(function(key) {
    return [key, dict[key]];
  });

  items.sort(function(first, second) {
    return second[1] - first[1];
  });


  displayValues(items,k,lefta,topa);
}

function displayValues(items,k,lefta,topa){
  ctx.font = "lighter 28px Times Abadi MT Condensed Light";
  ctx.strokeText(items[0][0] + ": " + roundToTwo(100*items[0][1]) + "%",lefta,topa-5);
  //showpredictionsmulti();
}

function roundToTwo(num) {    
  return +(Math.round(num + "e+2")  + "e-2");
}

function predictwithKMeans(){
  var inputKMeans = document.getElementById('ex1').value;
  if ((inputKMeans == "") || (inputKMeans < 1) || (inputKMeans > 20)) {
    return false;
  }
  if(isNaN(inputKMeans)){
    return false;
  }

  var closest;
  var tuplesXY = [];
  var bounds = [];
  var rectArray = [];
  var colorArray = ['#FFA500', '#8A2BE2', '#1E90FF', '#5F9EA0', '#FF7F50', '#DC143C', 
      '#FF8C00', '#556B2F', '#999966', '#008000', '#ADFF2F', '#FF69B4', '#4B0082',
      '#CD5C5C', '#F0E68C', '#9370DB', '#FAEBD7'];

  canvas_multi_sketch.forEachObject(function(obj) {
    var bound = obj.getBoundingRect();
    //console.log(bound);
    bounds.push(bound);

    //Can be uncommented to show the bounding boxes of the strikes in the canvas
    /*canvas_multi_sketch.contextContainer.strokeRect(
    bound.left - 5,
    bound.top - 5,
    bound.width + 10,
    bound.height + 10
    );*/
      
    //K MEANS
    left_v = bound.left - 5
    top_v = bound.top - 5
    width_v = bound.width + 10
    height_v = bound.height + 10
    right_v = left_v + width_v;
    down_v = top_v + height_v;

    let rect = {left: left_v, top:top_v, right:right_v, down:down_v};
    console.log(rect);

    var XY = [Math.floor(left_v + width_v / 2), Math.floor(top_v + height_v / 2)];
    tuplesXY.push(XY);
    rectArray.push(rect);
    })

    closest = kmeans(inputKMeans, tuplesXY);
    console.log("Closest clusters");
    console.log(closest);
    
    groups = groupdrawings(inputKMeans,closest,rectArray);
    console.log(groups);
    predictgroups(groups, colorArray);

}

function predictgroups(groups, colorArray){
  for(var k = 0;k<groups.length;k++){
    console.log(groups[k]);
    var lefta = groups[k]["left"];
    var topa = groups[k]["top"];
    var widtha = groups[k]["right"] - groups[k]["left"];
    var heighta = groups[k]["down"] - groups[k]["top"];
    //console.log("k" + k + ": " + clusters[k][0] + " " + clusters[k][1])
      ctx.beginPath();
      //ctx.arc(clusters[k][0], clusters[k][1], 10, 0, 2 * Math.PI);
      //ctx.fillStyle = colorArray[k];
      //ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = colorArray[k];
      ctx.rect(lefta, topa, widtha, heighta);
      ctx.stroke();
  
      var imageDataUInt8 = canvas_multi_sketch.contextContainer.getImageData(
        lefta * window.devicePixelRatio,
        topa * window.devicePixelRatio,
        widtha * window.devicePixelRatio,
        heighta * window.devicePixelRatio);
  
      var inputData = tf.tidy(() => {
        var tensor = tf.browser.fromPixels(imageDataUInt8, numChannels = 1);
        var rsTensor = tf.image.resizeBilinear(tensor, [28, 28]).toFloat();
    
        var temp = rsTensor.div(tf.scalar(255.0))
        var normalized = tf.scalar(1.0).sub(temp);
    
        var batchDims = normalized.expandDims(0);
        return batchDims
      })
    
      //prediction from loaded model
      var pred = model.predict(inputData).dataSync()
      console.log("pred");
      console.log(pred);
      createDictionary(pred,k,lefta,topa);
  }
}

function groupdrawings(inputKmeans, closest, rectArray)
{
  temp = [];
  for(var k=1;k<=inputKmeans;k++)
  {
      left_v = 1000;
      top_v = 1000;
      right_v = 0;
      down_v = 0;
      for(var i=0;i<rectArray.length;i++)
      {
          if(closest[i] === k)
          {
              //console.log(rectArray[i]["left"] + " " + rectArray[i]["top"] + " " + rectArray[i]["right"] + " " + rectArray[i]["down"]);
              left_v = Math.min(left_v, rectArray[i]["left"]);
              top_v = Math.min(top_v, rectArray[i]["top"]);
              right_v = Math.max(right_v, rectArray[i]["right"]);
              down_v = Math.max(down_v, rectArray[i]["down"]);
          }
      }
      let maxRect = {left: left_v, top:top_v, right:right_v, down:down_v};
      temp.push(maxRect);
  }
  return temp;
}


function kmeans(K, tuplesXY)
{
  var closest = [];
  var clusters = [];
  var averages = [];
  var total = 0;
  for(k=1;k<=K;k++){
      //clusters[k] = [Math.floor(Math.random() * 550) + 1, Math.floor(Math.random() * 350) + 1] //initalize to random points in dataset
      clusters[k] = tuplesXY[Math.floor(Math.random() * (tuplesXY.length-1) + 1)];
  }

  var no_iterations = 1000; //to be changed
  for (iter = 0; iter < no_iterations; iter++)
  {
      for (i = 0; i < tuplesXY.length; i++)
      {
          var dist = 2000; //infinite, canvas 800,600
          for (k = 1 ; k <= K; k++)
          {
            var euclidian = Math.sqrt( Math.pow((tuplesXY[i][0]-clusters[k][0]), 2) + Math.pow((tuplesXY[i][0]-clusters[k][0]), 2) );
              if(euclidian < dist){
                closest[i] = k;
                dist = euclidian;
              }
          }
        //if (iter == no_iterations-1){
        //    console.log(closest[i])
        //}
      }
      //average points
      for (k=1;k<=K;k++)
      {
        var sumX = 0;
        var sumY = 0;
        var counter = 0;
        for (i = 0; i < tuplesXY.length; i++)
            if(closest[i] == k){
              sumX = sumX + tuplesXY[i][0];
              sumY = sumY + tuplesXY[i][1];
              counter = counter + 1;
            }
        sumX = sumX / counter;
        sumY = sumY / counter;
        clusters[k] = [sumX, sumY];
      }
  }

  for (k = 1 ; k <= K; k++){
    //can be uncommented to see the clusters
    /*console.log("k" + k + ": " + clusters[k][0] + " " + clusters[k][1])
    ctx.beginPath();
    ctx.arc(clusters[k][0], clusters[k][1], 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'green';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#003300';
    ctx.stroke();*/

    for (i = 0; i < tuplesXY.length; i++)
        if(closest[i] == k){
            var euclidian = Math.sqrt( Math.pow((tuplesXY[i][0]-clusters[k][0]), 2) + Math.pow((tuplesXY[i][0]-clusters[k][0]), 2) );
            total = total + euclidian;
        }
  }

  total = (1/tuplesXY.length) * total;
  //console.log(K + " " + total);
  var q = [K, total];
  return closest;
}