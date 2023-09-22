////////////////////////////////////////////////////////////////////////
// A simple WebGL program to draw simple 2D shapes with animation.
//






var gl;
var color;
var animation;
var degree0 = 0;
var degree1 = 0;
var degree2 = 0;
var matrixStack = [];

// mMatrix is called the model matrix, transforms objects
// from local object space to world space.
var mMatrix = mat4.create();
var uMMatrixLocation;
var aPositionLocation;
var uColorLoc;


var circleBuf;
var circleIndexBuf;
var sqVertexPositionBuffer;
var sqVertexIndexBuffer;

var xOffset = 0.0;
var moveRight = true;

const vertexShaderCode = `#version 300 es
in vec2 aPosition;
uniform mat4 uMMatrix;

void main() {
  gl_Position = uMMatrix*vec4(aPosition,0.0,1.0);
  gl_PointSize = 10.0;
}`;

const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;

uniform vec4 color;

void main() {
  fragColor = color;
}`;

function pushMatrix(stack, m) {
  //necessary because javascript only does shallow push
  var copy = mat4.create(m);
  stack.push(copy);
}

function popMatrix(stack) {
  if (stack.length > 0) return stack.pop();
  else console.log("stack has no matrix to pop!");
}

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function vertexShaderSetup(vertexShaderCode) {
  shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, vertexShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function fragmentShaderSetup(fragShaderCode) {
  shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(shader, fragShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function initShaders() {
  shaderProgram = gl.createProgram();

  var vertexShader = vertexShaderSetup(vertexShaderCode);
  var fragmentShader = fragmentShaderSetup(fragShaderCode);

  // attach the shaders
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  //link the shader program
  gl.linkProgram(shaderProgram);

  // check for compilation and linking status
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
  }

  //finally use the program.
  gl.useProgram(shaderProgram);

  return shaderProgram;
}

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl2"); // the graphics webgl2 context
    gl.viewportWidth = canvas.width; // the width of the canvas
    gl.viewportHeight = canvas.height; // the height
  } catch (e) { }
  if (!gl) {
    alert("WebGL initialization failed");
  }
}

//function initCircleBuffer() {
// Increase this value for smoother circle
const circleVertices = [];
const circleIndices = [];

for (let i = 0; i <= 100000; i++) {
  const theta = (i / 100000) * Math.PI * 2;
  const x = Math.cos(theta);
  const y = Math.sin(theta);

  circleVertices.push(x, y);
  circleIndices.push(i);
}

circleBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);
circleBuf.itemSize = 2;
circleBuf.numItems = circleVertices.length / 2;

circleIndexBuf = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(circleIndices), gl.STATIC_DRAW);
circleIndexBuf.itemSize = 1;
circleIndexBuf.numItems = circleIndices.length;
//}

//function drawCircle(color, mMatrix) {
//l.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

// Bind the buffer containing circle vertices
/*gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
gl.vertexAttribPointer(
  aPositionLocation,
  circleBuf.itemSize,
  gl.FLOAT,
  false,
  0,
  0
);

gl.uniform4fv(uColorLoc, color);

// Draw the circle using gl.drawArrays (POINTS mode for a dotted circle)
gl.drawArrays(gl.POINTS, 0, circleBuf.numItems);
//}
*/




function initSquareBuffer() {
  // buffer for point locations
  const sqVertices = new Float32Array([
    0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  ]);
  sqVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
  sqVertexPositionBuffer.itemSize = 2;
  sqVertexPositionBuffer.numItems = 4;

  // buffer for point indices
  const sqIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  sqVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
  sqVertexIndexBuffer.itemsize = 1;
  sqVertexIndexBuffer.numItems = 6;
}

function drawSquare(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.vertexAttribPointer(
    aPositionLocation,
    sqVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);

  gl.uniform4fv(uColorLoc, color);

  // now draw the square
  gl.drawElements(
    gl.TRIANGLES,
    sqVertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
}

function initTriangleBuffer() {
  // buffer for point locations
  const triangleVertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
  triangleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
  triangleBuf.itemSize = 2;
  triangleBuf.numItems = 3;

  // buffer for point indices
  const triangleIndices = new Uint16Array([0, 1, 2]);
  triangleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
  triangleIndexBuf.itemsize = 1;
  triangleIndexBuf.numItems = 3;
}

function drawTriangle(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.vertexAttribPointer(
    aPositionLocation,
    triangleBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);

  gl.uniform4fv(uColorLoc, color);

  // now draw the square
  gl.drawElements(
    gl.TRIANGLES,
    triangleIndexBuf.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
}

function initCircleBuffer() {
  const numSegments = 1000;
  const circleVertices = [];
  const circleIndices = [];

  for (let i = 0; i <= numSegments; i++) {
    const theta = (i / numSegments) * Math.PI * 2;
    const x = Math.cos(theta);
    const y = Math.sin(theta);

    circleVertices.push(x, y);
    circleIndices.push(i);
  }

  circleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);
  circleBuf.itemSize = 2;
  circleBuf.numItems = circleVertices.length / 2;

  circleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(circleIndices), gl.STATIC_DRAW);
  circleIndexBuf.itemSize = 1;
  circleIndexBuf.numItems = circleIndices.length;
}

function drawCircle(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // Bind the buffer containing circle vertices
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
  gl.vertexAttribPointer(
    aPositionLocation,
    circleBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.uniform4fv(uColorLoc, color);

  // Draw the circle using gl.drawElements (TRIANGLE_FAN mode)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
  gl.drawElements(gl.TRIANGLE_FAN, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
}






////////////////////////////////////////////////////////////////////////
function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  // stop the current loop of animation
  if (animation) {
    window.cancelAnimationFrame(animation);
  }

  var animate = function () {
    gl.clearColor(0.3, 0.8, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);

    degree0 += 0.9;
    degree1 -= 1.2;
    degree2 += 0.2;

    if (moveRight) {
      xOffset += 0.002; // speed
      if (xOffset > 0.75) {
        moveRight = false;
      }
    } else {
      xOffset -= 0.002; // speed
      if (xOffset < -0.85) {
        moveRight = true;
      }
    }






    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight / 2);
    color = [0.2, 1.0, 1.0, 1.0]; // Green color
    pushMatrix(matrixStack, mMatrix);
    // Draw shapes or components for the bottom half here
    mMatrix = popMatrix(matrixStack);

    // Reset the viewport to cover the entire canvas
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);



    // draw grass



    //draw square
    /* pushMatrix(matrixStack, mMatrix);
     mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
     mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
     mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
     pushMatrix(matrixStack, mMatrix);
     color = [0.8, 0, 0, 1];
     mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
     mMatrix = mat4.scale(mMatrix, [0.3, 0.75, 1.0]);
     drawSquare(color, mMatrix);
     mMatrix = popMatrix(matrixStack);
     mMatrix = popMatrix(matrixStack);
 
     //draw triangle
     pushMatrix(matrixStack, mMatrix);
     mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
     mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
     mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
     pushMatrix(matrixStack, mMatrix);
     mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
     mMatrix = mat4.scale(mMatrix, [0.6, 0.6, 1.0]);
     color = [0.4, 0.9, 0, 1];
     drawTriangle(color, mMatrix);
     mMatrix = popMatrix(matrixStack);
     mMatrix = popMatrix(matrixStack);
     */






    //draw circle
    // Inside the drawScene function
    // ...
    //draw circle
    /*pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.8, 0.85, 0.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(degree2), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix, [0.1, 0.1, 1.0]); // Adjust the scale as needed
    color = [1.0, 1.0, 0.0, 1.0]; // Yellow color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.8, 0.85, 0.0]);
  //  mMatrix = mat4.rotate(mMatrix, degToRad(degree2), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix, [0.09, 0.09, 1.0]); // Adjust the scale as needed
    color = [1.0, 1.0, 0.0, 1.0]; // Yellow color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.8, 0.85, 0.0]);
  //  mMatrix = mat4.rotate(mMatrix, degToRad(degree2), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix, [0.07, 0.07, 1.0]); // Adjust the scale as needed
    color = [1.0, 1.0, 0.0, 1.0]; // Yellow color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.8, 0.85, 0.0]);
  //  mMatrix = mat4.rotate(mMatrix, degToRad(degree2), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix, [0.05, 0.05, 1.0]); // Adjust the scale as needed
    color = [1.0, 1.0, 0.0, 1.0]; // Yellow color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.8, 0.85, 0.0]);
  //  mMatrix = mat4.rotate(mMatrix, degToRad(degree2), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix, [0.03, 0.03, 1.0]); // Adjust the scale as needed
    color = [1.0, 1.0, 0.0, 1.0]; // Yellow color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.8, 0.85, 0.0]);
  //  mMatrix = mat4.rotate(mMatrix, degToRad(degree2), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix, [0.02, 0.02, 1.0]); // Adjust the scale as needed
    color = [1.0, 1.0, 0.0, 1.0]; // Yellow color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.8, 0.85, 0.0]);
  //  mMatrix = mat4.rotate(mMatrix, degToRad(degree2), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix, [0.01, 0.01, 1.0]); // Adjust the scale as needed
    color = [1.0, 1.0, 0.0, 1.0]; // Yellow color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    */


    //mountains
    //mountain 1 part 1
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.9, 0.0, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.7, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [3, 0.4, 1.0]);
    color = [0.6, 0.3, 0, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);


    //mountain 1 part 2
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.9, 0.0, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.75, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [2, 0.45, 1.0]);
    color = [0.6, 0.5, 0.3, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    //mountain 2 part 1
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.9, 0.0, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [1.32, 0.022, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [3.0, 0.55, 1.0]);
    color = [0.6, 0.3, 0, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //mountain 2 part 2
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.9, 0.0, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [1.33, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [2.7, 0.6, 1.0]);
    color = [0.6, 0.5, 0.3, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //mountain 3 
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.9, 0.0, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [2, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.35, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [2, 0.35, 1.0]);
    color = [0.6, 0.5, 0.3, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);



    //rightmost tree
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.038, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.26, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.6, 0.3, 0, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.05, 0.5, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.75, 0.4, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.32, 0.3, 1.0]);
    color = [0.3, 0.5, 0.1, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.75, 0.44, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.35, 0.3, 1.0]);
    color = [0.3, 0.7, 0.2, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.75, 0.48, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.38, 0.3, 1.0]);
    color = [0.3, 0.8, 0.3, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);



    //middle tree
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.17, 0.038, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.26, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.6, 0.3, 0, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.06, 0.6, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.42, 0.44, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.43, 0.32, 1.0]);
    color = [0.3, 0.5, 0.1, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.42, 0.5, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.46, 0.35, 1.0]);
    color = [0.3, 0.7, 0.2, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);



    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.42, 0.53, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.43, 0.3, 1.0]);
    color = [0.3, 0.8, 0.3, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    //leftmost tree
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.01, 0.038, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.15, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.6, 0.3, 0, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.035, 0.4, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.15, 0.36, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.3, 0.25, 1.0]);
    color = [0.3, 0.5, 0.1, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.15, 0.4, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.35, 0.25, 1.0]);
    color = [0.3, 0.7, 0.2, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);



    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.15, 0.44, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.39, 0.25, 1.0]);
    color = [0.3, 0.8, 0.3, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);















    //grass
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.0, -0.7, 1]);
    mMatrix = mat4.scale(mMatrix, [2, 1.5, 1.0]);
    color = [0.0, 1.0, 0.0, 1.0];
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);



    //river
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.0, -0.08, 1]);
    mMatrix = mat4.scale(mMatrix, [2, 0.2, 1.0]);
    color = [0.2, 0.6, 1, 1.0];
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);


    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);

    //white strips in river



    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.2, 0.47, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.33, -0.5, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [1, 1, 1, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.35, 0.003, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);




    // boat
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);

    // Apply horizontal translation based on xOffset
    mMatrix = mat4.translate(mMatrix, [0.5 + xOffset, 0.0, 0.0]);

    // Draw inverted triangle
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.5, -0.15, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.28, 0.12, 1.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(180), [0.0, 0.0, 1.0]); // Invert along the y-axis
    color = [0.6, 0.8, 0.6, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //boat ki dandi

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.038, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [-0.5 + xOffset, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.01, 0.25, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //boat ki dandi

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.45, 0.06, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [-0.5 + xOffset, 0.0, 0.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(-27), [0.0, 0.0, 1.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.04, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.005, 0.27, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //boat flag

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);

    // Apply horizontal translation based on xOffset
    mMatrix = mat4.translate(mMatrix, [0.5 + xOffset, 0.0, 0.0]);

    // Draw inverted triangle
    pushMatrix(matrixStack, mMatrix);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.124, 0.035, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.2, 1.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(270), [0.0, 0.0, 1.0]); // Rotate by 90 degrees
    // Invert along the y-axis
    color = [0.9, 0.2, 0.2, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    // boat




    //boat flag








    //river
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.0, -0.18, 1]);
    mMatrix = mat4.scale(mMatrix, [2, 0.08, 1.0]);
    color = [0.2, 0.6, 1, 1.0];
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.3, 0.33, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.33, -0.5, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [1, 1, 1, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.35, 0.003, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);





    //green
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.0, -1.05, 1]);
    mMatrix = mat4.scale(mMatrix, [2, 1.5, 1.0]);
    color = [0.0, 1.0, 0.0, 1.0];
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);




    //darker grass



    //right windmill
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.44, 0.01, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    // let boatAngle = degToRad(i * 90 + degree1); // Update ray angle based on scene rotation
    //mMatrix = mat4.rotate(mMatrix, rayAngle, [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.15, -0.2, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.2, 0.2, 0.1, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.03, 0.55, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    color = [0.8, 0.7, 0.2, 1.0]; // Yellow color for rays
    for (let i = 0; i < 4; i++) {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.translate(mMatrix, [0.58, 0.06, 0.0]); // Move to circle's center

      // Rotate the whole scene
      mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);

      // Rotate each ray
      var rayAngle = degToRad(i * 90 + degree1); // Update ray angle based on scene rotation
      mMatrix = mat4.rotate(mMatrix, rayAngle, [0.0, 0.0, 1.0]);

      // Translate along the y-axis to position the rays outside the circle
      mMatrix = mat4.translate(mMatrix, [0.01, 0.1, 1]); // Adjust the distance from the circumference

      // Scale to make the lines shorter
      mMatrix = mat4.scale(mMatrix, [0.05, 0.2, 1.0]);
      mMatrix = mat4.scale(mMatrix, [1.2, -1.0, 1.0]);

      drawTriangle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }


    //mMatrix = popMatrix(matrixStack);








    //left windmill
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.7, 0.01, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.15, -0.2, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.2, 0.2, 0.1, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.03, 0.55, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    color = [0.8, 0.7, 0.2, 1.0]; // Yellow color for rays
    for (let i = 0; i < 4; i++) {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.translate(mMatrix, [-0.555, 0.06, 0.0]); // Move to circle's center

      // Rotate the whole scene
      mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);

      // Rotate each ray
      let rayAngle = degToRad(i * 90 + degree1); // Update ray angle based on scene rotation
      mMatrix = mat4.rotate(mMatrix, rayAngle, [0.0, 0.0, 1.0]);

      // Translate along the y-axis to position the rays outside the circle
      mMatrix = mat4.translate(mMatrix, [0.01, 0.1, 1]); // Adjust the distance from the circumference

      // Scale to make the lines shorter
      mMatrix = mat4.scale(mMatrix, [0.05, 0.2, 1.0]);
      mMatrix = mat4.scale(mMatrix, [1.2, -1.0, 1.0]);

      drawTriangle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }


    //bushes

    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [0.25, -1.02, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.1, 0.07, 1.0]); // Adjust the scale of the circle
    color = [0.11, 0.1, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [-0.22, -1.02, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.1, 0.07, 1.0]); // Adjust the scale of the circle
    color = [0.2, 0.8, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);


    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [0.0, -1, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.2, 0.1, 1.0]); // Adjust the scale of the circle
    color = [0.2, 0.4, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);



    //rightmost bush

    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [0.85, -0.45, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.1, 0.07, 1.0]); // Adjust the scale of the circle
    color = [0.2, 0.8, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);


    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [1, -0.45, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.15, 0.1, 1.0]); // Adjust the scale of the circle
    color = [0.2, 0.4, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);


    //leftmost bush
    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [-1, -0.53, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.07, 0.05, 1.0]); // Adjust the scale of the circle
    color = [0.2, 0.8, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [-0.9, -0.53, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.08, 0.05, 1.0]); // Adjust the scale of the circle
    color = [0.2, 0.4, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    //bush next to house

    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [-0.4, -0.53, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.07, 0.05, 1.0]); // Adjust the scale of the circle
    color = [0.2, 0.8, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);


    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [-0.22, -0.53, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.05, 0.04, 1.0]); // Adjust the scale of the circle
    color = [0.2, 0.4, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [-0.3, -0.53, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.08, 0.05, 1.0]); // Adjust the scale of the circle
    color = [0.3, 0.6, 0.3, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);














    //house
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.65, 0.01, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.05, -0.5, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.9, 0.9, 0.9, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.45, 0.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //left window
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.8, 0.04, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.07, -0.5, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.9, 0.7, 0.1, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.06, 0.06, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //right window
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.8, 0.07, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.2, -0.6, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.9, 0.7, 0.1, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.06, 0.12, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //door
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.8, 0.04, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.33, -0.5, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.9, 0.7, 0.1, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.06, 0.06, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //roof rectangle
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.65, 0.21, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.05, -0.5, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [1, 0.4, 0.2, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.35, 0.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //roof left traingle
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.778, -0.288, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.3, 0.203, 1.0]);
    color = [1, 0.4, 0.2, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //roof right triangle
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.439, -0.289, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.3, 0.203, 1.0]);
    color = [1, 0.4, 0.2, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    //bottommost bird
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);

    // Apply horizontal translation based on xOffset
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);

    // Draw inverted triangle
    pushMatrix(matrixStack, mMatrix);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.124, 0.7, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.01, 1.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(140), [0.0, 0.0, 1.0]); // Rotate by 90 degrees
    // Invert along the y-axis
    color = [0.0, 0.0, 0.0, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);

    // Apply horizontal translation based on xOffset
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);

    // Draw inverted triangle
    pushMatrix(matrixStack, mMatrix);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.06, 0.7, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.01, 1.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(120), [0.0, 0.0, 1.0]); // Rotate by 90 degrees
    // Invert along the y-axis
    color = [0.0, 0.0, 0.0, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.612, 0.69, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.01, 0.02, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);



    //leftmost birds
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);

    // Apply horizontal translation based on xOffset
    mMatrix = mat4.translate(mMatrix, [0.2, 0.08, 0.0]);

    // Draw inverted triangle
    pushMatrix(matrixStack, mMatrix);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.108, 0.7, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.045, 0.01, 1.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(140), [0.0, 0.0, 1.0]); // Rotate by 90 degrees
    // Invert along the y-axis
    color = [0.0, 0.0, 0.0, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);

    // Apply horizontal translation based on xOffset
    mMatrix = mat4.translate(mMatrix, [0.2, 0.08, 0.0]);

    // Draw inverted triangle
    pushMatrix(matrixStack, mMatrix);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.07, 0.7, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.05, 0.01, 1.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(120), [0.0, 0.0, 1.0]); // Rotate by 90 degrees
    // Invert along the y-axis
    color = [0.0, 0.0, 0.0, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.30, 0.77, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.01, 0.02, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    //next bird
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);

    // Apply horizontal translation based on xOffset
    mMatrix = mat4.translate(mMatrix, [0.2, 0.08, 0.0]);

    // Draw inverted triangle
    pushMatrix(matrixStack, mMatrix);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.30, 0.8, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.035, 0.005, 1.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(140), [0.0, 0.0, 1.0]); // Rotate by 90 degrees
    // Invert along the y-axis
    color = [0.0, 0.0, 0.0, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);

    // Apply horizontal translation based on xOffset
    mMatrix = mat4.translate(mMatrix, [0.2, 0.08, 0.0]);

    // Draw inverted triangle
    pushMatrix(matrixStack, mMatrix);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.33, 0.8, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.035, 0.005, 1.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(120), [0.0, 0.0, 1.0]); // Rotate by 90 degrees
    // Invert along the y-axis
    color = [0.0, 0.0, 0.0, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.525, 0.87, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.005, 0.015, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);









    //sun
    mMatrix = mat4.translate(mMatrix, [-0.8, 0.85, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.098, 0.099, 1.0]); // Adjust the scale of the circle
    color = [1, 1, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);


    //left windmill circle
    mMatrix = mat4.translate(mMatrix, [-0.555, 0.06, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.03, 0.03, 1.0]); // Adjust the scale of the circle
    color = [0, 0, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    //car right tyre
    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [-0.35, -0.87, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.045, 0.045, 1.0]); // Adjust the scale of the circle
    color = [0, 0, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [-0.35, -0.87, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.035, 0.035, 1.0]); // Adjust the scale of the circle
    color = [0.4, 0.4, 0.4, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);




    //car left tyre
    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [-0.62, -0.87, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.045, 0.045, 1.0]); // Adjust the scale of the circle
    color = [0, 0, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [-0.62, -0.87, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.035, 0.035, 1.0]); // Adjust the scale of the circle
    color = [0.4, 0.4, 0.4, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);


    //right windmill circle
    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [0.584, 0.06, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.03, 0.03, 1.0]); // Adjust the scale of the circle
    color = [0, 0, 0, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    //badal
    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [-0.78, 0.57, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.2, 0.1, 1.0]); // Adjust the scale of the circle
    color = [1, 1, 1, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [-0.6, 0.55, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.15, 0.08, 1.0]); // Adjust the scale of the circle
    color = [1, 1, 1, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);


    pushMatrix(matrixStack, mMatrix)
    mMatrix = mat4.translate(mMatrix, [-0.4, 0.54, 0.0]); // Move the circle to a desired position
    mMatrix = mat4.scale(mMatrix, [0.09, 0.054, 1.0]); // Adjust the scale of the circle
    color = [1, 1, 1, 1.0]; // Blue color
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);





    //car bottom center
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.65, -0.3, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.17, -0.5, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.4, 0.5, 0.9, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.43, 0.1, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //car bottom left triangle
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.778, -0.284, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.575, -0.515, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.15, 0.1, 1.0]);
    color = [0.4, 0.5, 0.9, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //car bottom right triangle
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.439, -0.284, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.6655, -0.515, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.15, 0.1, 1.0]);
    color = [0.4, 0.5, 0.9, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);


    //car bottom center
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.65, -0.2, 0.0]);
    //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.17, -0.5, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.5, 0.3, 0.1, 1];
    mMatrix = mat4.translate(mMatrix, [-0.007, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.2, 0.1, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);



    // mMatrix = popMatrix(matrixStack);



    //car bottom left triangle
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.778, -0.2, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.69, -0.5, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.12, 0.1, 1.0]);
    color = [0.5, 0.3, 0.1, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    //car bottom right triangle
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.439, -0.2, 0.0]);
    // mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.55, -0.5, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.15, 0.1, 1.0]);
    color = [0.5, 0.3, 0.1, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);





    //sun


    // draw rays
    // Yellow color for rays
    for (let i = 0; i < 8; i++) {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.translate(mMatrix, [-0.8, 0.85, 0.0]); // Move to circle's center

      // Rotate the whole scene
      mMatrix = mat4.rotate(mMatrix, degToRad(degree2), [0.0, 0.0, 1.0]);

      color = [1.0, 1.0, 0.0, 1.0];

      // Rotate each ray
      let rayAngle = degToRad(i * 45 + degree2); // Update ray angle based on scene rotation
      mMatrix = mat4.rotate(mMatrix, rayAngle, [0.0, 0.0, 1.0]);

      // Translate along the y-axis to position the rays outside the circle
      mMatrix = mat4.translate(mMatrix, [0.0, 0.12, 0.0]); // Adjust the distance from the circumference

      // Scale to make the lines shorter
      mMatrix = mat4.scale(mMatrix, [0.004, 0.055, 1.0]);

      drawSquare(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }
    animation = window.requestAnimationFrame(animate);
  };

  animate();
}


// This is the entry point from the html
function webGLStart() {
  var canvas = document.getElementById("exampleAnimation2D");
  initGL(canvas);
  shaderProgram = initShaders();

  //get locations of attributes declared in the vertex shader
  const aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");

  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");

  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation);

  uColorLoc = gl.getUniformLocation(shaderProgram, "color");



  initCircleBuffer();
  initSquareBuffer();
  initTriangleBuffer();





  drawScene();
}
