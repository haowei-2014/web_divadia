var myApp = angular.module('myApp', []);

myApp.controller('simpleController', function ($scope) {
    paper.install(window);
    init();

    function init() {
        $scope.polygon = [];
        canvas = document.getElementById('canvas');
        paper.setup(canvas);
        raster = new Raster('parzival');
        raster.position = view.center;
        zoom = 0.2;
        project.activeLayer.scale(zoom);
        myPath = new Path();
        myPath.strokeColor = 'red';
        myPath.strokeWidth = 2;
        lastClick = 0;
        pathFinished = false;
        tool = new Tool();
        //        initDim();
        img = document.getElementById("parzival");
        imgWidth = img.width;
        imgHeight = img.height;
        alert(imgWidth + " , " + imgHeight);
    }





    //    view.onFrame = function (event) {
    //        if (imgChanged) {
    //            imgChanged = false;
    //            img = document.getElementById("parzival");
    //            imgWidth = img.width;
    //            imgHeight = img.height;
    //            alert(imgWidth + " , " + imgHeight);
    //        }
    //    }


    // get the position of the pixel which is being clicked.
    tool.onMouseUp = function (event) {
        //  alert(event.offsetX + "  " + event.offsetY);
        // if the path is finished, then begin a new path
        if (pathFinished) {
            myPath = new Path();
            myPath.strokeColor = 'red';
            myPath.strokeWidth = 2;
            $scope.polygon = [];
            pathFinished = false;
        }

        // test if the mousedown is single or double click.
        var single = true;
        var drag = false;
        var d = new Date();
        var t = d.getTime();
        if (event.delta.length == 0)
            drag = false;
        else
            drag = true;
        if (t - lastClick < 200) {
            console.log("double")
            single = false;

        } else {
            console.log("single");
        }
        lastClick = t;

        // calculate the postion of the pixel respect to the top-left corner of the image.
        //           console.log(raster.bounds.x);
        //           console.log(event.clientX);
        // ATTENTION: take care of the event. When I use canvas.onmouseup = function (event) {}, 
        // I should write in the following way, which is consistent with the next 
        // canvas.addEventListener("mousewheel", function (e) {}
        //           var xClick = Math.round(event.offsetX - raster.bounds.x) / zoom;
        //           var yClick = Math.round(event.offsetY - raster.bounds.y) / zoom;

        var xClick = Math.round((event.point.x - raster.bounds.x) / zoom);
        var yClick = Math.round((event.point.y - raster.bounds.y) / zoom);

        var pElement = $("#xyClick");
        //var scope = $('#xyClick').scope();

        // update the point information of the polygon
        if (xClick < 0 || xClick >= imgWidth || yClick < 0 || yClick >= imgHeight) {
            pElement.html("Out of the image!");
        } else if (!drag) {
            myPath.add(event.point);
            pElement.html("x: " + xClick + ", y: " + yClick);
            $scope.polygon.push({
                x: xClick,
                y: yClick
            });
        }

        // if double click, then the path is finished.
        if (!single) {
            myPath.closed = true;
            pathFinished = true;
            $scope.polygon.pop(); // remove the last element of the polygon, because it was added twice,
            // due to the two mouseup.
            updateDOM();
        }
        $scope.$apply();
    }


    // pan the image 
    tool.onMouseDrag = function (event) {
        console.log('You dragged the mouse!');
        var vector = event.delta;
        console.log(vector);
        project.activeLayer.position = new Point(project.activeLayer.position.x + vector.x,
            project.activeLayer.position.y + vector.y);
    }


    // This method is to zoom in/out. After zooming, the pixel under the cursor will move away, so we 
    // have to move it back to the cursor. This is transformed by a little complicated coordinate 
    // transformation. See "Coordinate_transformation.pdf".
    canvas.addEventListener("mousewheel", function (e) {

        //   alert("mousewheel");
        e.preventDefault();
        var direction = e.deltaY;
        var scaleFactor = 1.5;


        var xPToImageLast = Math.round(e.offsetX - raster.bounds.x);
        var yPToImageLast = Math.round(e.offsetY - raster.bounds.y);

        var xPToImageNew;
        var yPToImageNew;


        if (direction < 0) {
            zoom = zoom * scaleFactor;
            project.activeLayer.scale(scaleFactor);
            xPToImageNew = xPToImageLast * scaleFactor;
            yPToImageNew = yPToImageLast * scaleFactor;
        } else {
            zoom = zoom / scaleFactor;
            project.activeLayer.scale(1 / scaleFactor);
            xPToImageNew = xPToImageLast / scaleFactor;
            yPToImageNew = yPToImageLast / scaleFactor;
        }

        var xPToCanvasNew = xPToImageNew + Math.round(raster.bounds.x);
        var yPToCanvasNew = yPToImageNew + Math.round(raster.bounds.y);

        var offsetXFromPToCursor = Math.round(e.offsetX - xPToCanvasNew);
        var offsetYFromPToCursor = Math.round(e.offsetY - yPToCanvasNew);
        //     raster.position += new Point(offsetXFromPToCursor, offsetYFromPToCursor);
        project.activeLayer.position = new Point(raster.position.x + offsetXFromPToCursor,
            raster.position.y + offsetYFromPToCursor);
    });

    function loadXMLDoc(filename) {
        if (window.XMLHttpRequest) {
            xhttp = new XMLHttpRequest();
        } else // code for IE5 and IE6
        {
            xhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xhttp.open("GET", filename, false);
        xhttp.send();
        return xhttp.responseXML;
    }

    function loadXMLString(txt) {
        if (window.DOMParser) {
            parser = new DOMParser();
            xmlDoc = parser.parseFromString(txt, "text/xml");
        } else // Internet Explorer
        {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = false;
            xmlDoc.loadXML(txt);
        }
        return xmlDoc;
    }

    // import the ground truth
    $scope.importGT = function () {
        // click the <input type = 'file'> by program
        $('#myInput').click();
    }

    // do import event whenever #myInput is closed.
    $("#myInput").change(function () {
        var fileToLoad = document.getElementById("myInput").files[0];
        //   var fileToLoad = document.getElementById("fileToLoad").files[0];
        var fileReader = new FileReader();
        fileReader.onload = function (fileLoadedEvent) {
            var textFromFileLoaded = fileLoadedEvent.target.result;
            // document.getElementById("inputTextToSave").value = textFromFileLoaded;
            drawGT(textFromFileLoaded);
        };
        fileReader.readAsText(fileToLoad, "UTF-8");
        //       var fileText = fileReader.result;
    });

    // draw ground truth on the canvas
    function drawGT(x) {
        xmlDoc = loadXMLString(x);

        var myPath;
        var page = xmlDoc.getElementsByTagName("Page")[0];
        var textRegions = page.childNodes;

        for (i = 0; i < textRegions.length; i++) {
            myPath = new Path();
            myPath.strokeWidth = 1;
            var points = textRegions[i].childNodes[0].childNodes;

            // assign color to different classes
            switch (textRegions[i].getAttribute("type")) {
            case "textline":
                myPath.strokeColor = 'green';
                break;
            case "decoration":
                myPath.strokeColor = 'magenta';
                break;
            case "comment":
                myPath.strokeColor = 'orange';
                break;
            case "text":
                myPath.strokeColor = 'blue';
                break;
            case "page":
                myPath.strokeColor = 'white';
                break;
            }

            for (j = 0; j < points.length; j++) {
                pointPath = points[j];
                x = pointPath.getAttribute("x");
                y = pointPath.getAttribute("y");
                // transform the coordinate to display it
                x = x * zoom + raster.bounds.x;
                y = y * zoom + raster.bounds.y;
                myPath.add(new Point(x, y));
            }
            myPath.closed = true;
        }
    }

    function updateDOM() {
        var page = xmlDoc.getElementsByTagName("Page")[0];
        newCd = xmlDoc.createElement("Coords");
        for (i = 0; i < $scope.polygon.length; i++) {
            newPt = xmlDoc.createElement("Point");
            newY = xmlDoc.createAttribute("y");
            newY.nodeValue = $scope.polygon[i].y;
            newX = xmlDoc.createAttribute("x");
            newX.nodeValue = $scope.polygon[i].x;
            newPt.setAttributeNode(newY);
            newPt.setAttributeNode(newX);
            newCd.appendChild(newPt);
        }
        newTR = xmlDoc.createElement("TextRegion");
        newAttCom = xmlDoc.createAttribute("comments");
        newAttCom.nodeValue = "";
        newAttCus = xmlDoc.createAttribute("custom");
        newAttCus.nodeValue = "0";
        newAttID = xmlDoc.createAttribute("id");
        newAttID.nodeValue = "123456789";
        newAttTp = xmlDoc.createAttribute("type");
        newAttTp.nodeValue = "textline";
        newTR.setAttributeNode(newAttCom);
        newTR.setAttributeNode(newAttCus);
        newTR.setAttributeNode(newAttID);
        newTR.setAttributeNode(newAttTp);
        newTR.appendChild(newCd);
        page.appendChild(newTR);
    }


    $scope.exportGT = function () {
        var textToWrite = (new XMLSerializer()).serializeToString(xmlDoc);
        alert(textToWrite);
        var textFileAsBlob = new Blob([textToWrite], {
            type: 'text/xml'
        });
        //       var fileNameToSaveAs = document.getElementById("inputFileNameToSaveAs").value;
        var fileNameToSaveAs = "myDownload";
        var downloadLink = document.createElement("a");
        downloadLink.download = fileNameToSaveAs;
        downloadLink.innerHTML = "Download File";
        if (window.webkitURL != null) {
            // Chrome allows the link to be clicked
            // without actually adding it to the DOM.
            downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
        } else {
            // Firefox requires the link to be added to the DOM
            // before it can be clicked.
            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
            downloadLink.onclick = destroyClickedElement;
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
        }
        downloadLink.click();
    }

    $scope.importImg = function () {
        /*alert("change image");
        document.getElementById("parzival").src = "276_original.png";
        var ni = new Image();
        ni.onload = function () {
            imgWidthTmp = ni.width;
            imgHeightTmp = ni.height;
            alert(imgWidthTmp);
            imgWidth = imgWidthTmp;
            imgHeight = imgHeightTmp;
        }
        ni.src = document.getElementById("parzival").src;

        init();*/
        $('#myImg').click();
    }
    
    /*$scope.importGT = function () {
        // click the <input type = 'file'> by program
        $('#myInput').click();
    }*/
    

    $scope.fileNameChanged = function (event) {
        console.log("select file");
        var selectedFile = event.target.files[0];
        var reader = new FileReader();

        var imgtag = document.getElementById("myimage");
        imgtag.title = selectedFile.name;

        reader.onload = function (event) {
//            imgtag.src = event.target.result;
            document.getElementById("parzival").src = event.target.result;
            init();
        };

        reader.readAsDataURL(selectedFile);
    }
});

myApp.config(function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
});

//function onFileSelected(event) {
//    var selectedFile = event.target.files[0];
//    var reader = new FileReader();
//
//    var imgtag = document.getElementById("myimage");
//    imgtag.title = selectedFile.name;
//
//    reader.onload = function (event) {
//        imgtag.src = event.target.result;
//    };
//
//    reader.readAsDataURL(selectedFile);
//}