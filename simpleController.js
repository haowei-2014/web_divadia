var myApp = angular.module('myApp', []);

myApp.controller('simpleController', function ($scope) {
    paper.install(window);
    init();
    imgName = null;

    function init() {
        $scope.polygon = [];
        $scope.color = 'noColor';
        $scope.mode = 'display';
        //     $scope.mousePos = '111111111111';
        canvas = document.getElementById('canvas');
        paper.setup(canvas);
        raster = new Raster('parzival');
        raster.position = view.center;
        zoom = 0.2;
        project.activeLayer.scale(zoom);
        myPath = new Path();
        myPath.strokeColor = $scope.color;
        myPath.strokeWidth = 2;
        lastClick = 0;
        pathFinished = true;
        tool = new Tool();
        img = document.getElementById("parzival");
        imgWidth = img.width;
        imgHeight = img.height;
        xmlDoc = null;

        currentModify = null;
        currentModifyPts = [];
        currentModifyPt = null;
        currentModifyPtCircle = null;
        currentModifyPtIndex = 0;
        //alert();
        //       alert(imgWidth + " , " + imgHeight);

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
        switch ($scope.mode) {
        case "display":
            display();
            break;
        case "draw":
            draw(event);
            break;
        case "modify":
            modify(event);
            break;
        }
    }

    function display() {}

    function modify(event) {}


    function draw(event) {
        //  alert(event.offsetX + "  " + event.offsetY);
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

        // if the path is finished, then begin a new path
        if (!drag && pathFinished) {
            myPath = new Path();
            myPath.strokeColor = $scope.color;
            myPath.strokeWidth = 2;
            $scope.polygon = [];
            pathFinished = false;
        }

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
        } else if (!drag && single) {
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
            if (xmlDoc == null)
                initDom();
            updateDOM();

            myPath.onClick = function (event) {
                //      this.fillColor = 'red';
                this.selected = true;
                //       alert(this.segments);
                //       alert(event.point);
                alert("path click here");
                if ($scope.mode == 'modify') {
                    currentModify = this;
                    var currentModifyPtsLength = currentModify.segments.length;
                    if (currentModifyPts.length != 0)
                        currentModifyPts = [];
                    for (var i = 0; i < currentModifyPtsLength; i++) {
                        currentModifyPts.push(currentModify.segments[i].point);
                    }
                    //                    alert(currentModifyPts);
                }

            }

        }
        $scope.$apply();
    }



    // pan the image 
    tool.onMouseDrag = function (event) {

        if (currentModifyPtCircle != null)
            currentModifyPtCircle.remove();
        if ((currentModifyPt != null) &&
            (lineDistance(event.downPoint, currentModifyPt) <= 10)) {

            /*var pathTest = new Path();
            pathTest.strokeColor = 'black';
            pathTest.add(new Point(currentModifyPt.x, currentModifyPt.y));
            pathTest.add(new Point(event.point.x, event.point.y));
            console.log("pathTest");*/
            console.log(event.downPoint);
            console.log(currentModifyPt);

            currentModify.segments[currentModifyPtIndex].point = event.point;


        } else {
            //    console.log('You dragged the mouse!');
            var vector = event.delta;
            //    console.log(vector);
            project.activeLayer.position = new Point(project.activeLayer.position.x + vector.x,
                project.activeLayer.position.y + vector.y);
        }
    }


    tool.onMouseMove = function (event) {
        //     console.log(event.point);
        $scope.mousePos = 'x: ' + Math.round(event.point.x) + ', y: ' + Math.round(event.point.y);
        $scope.$apply();



        /*if (currentModifyPt != null)
            currentModifyPt.remove();*/

        if ($scope.mode == 'modify') {
            if (currentModify != null) {
                for (var i = 0; i < currentModifyPts.length; i++) {

                    if (lineDistance(event.point, currentModifyPts[i]) < 30) {
                        console.log("enough");

                        currentModifyPtCircle = new Path.Circle({
                            center: [currentModifyPts[i].x, currentModifyPts[i].y],
                            radius: 10
                        });

                        currentModifyPtCircle.strokeColor = '#ff0000';
                        currentModifyPtCircle.fillColor = 'blue';

                        currentModifyPtCircle.removeOnMove();
                        currentModifyPt = new Point(currentModifyPts[i].x, currentModifyPts[i].y);
                        currentModifyPtIndex = i;


                    }
                }
            }
        }
    }

    function lineDistance(point1, point2) {
        var xs = 0;
        var ys = 0;

        xs = point2.x - point1.x;
        xs = xs * xs;

        ys = point2.y - point1.y;
        ys = ys * ys;

        return Math.sqrt(xs + ys);
    }


    // This method is to zoom in/out. After zooming, the pixel under the cursor will move away, so we 
    // have to move it back to the cursor. This is transformed by a little complicated coordinate 
    // transformation. See "Coordinate_transformation.pdf".
    /*canvas.addEventListener("mousewheel", function (e) {

//        if (currentModifyPt != null)
//            currentModifyPt.remove();

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
    });*/

    $('#canvas').bind('mousewheel DOMMouseScroll MozMousePixelScroll', function (e) {
        var delta = 0;
        var scaleFactor = 1.5;
        e.preventDefault();
        if (e.type == 'mousewheel') { //this is for chrome/IE
            delta = e.originalEvent.wheelDelta;
        } else if (e.type == 'DOMMouseScroll') { //this is for FireFox
            delta = e.originalEvent.detail * -1; //FireFox reverses the scroll so we force to to re - reverse...
        }
        if (delta > 0) { //scroll up
            zoom = zoom / scaleFactor;
            project.activeLayer.scale(1 / scaleFactor);
           // alert("zoom out");
        } else if (delta < 0) { //scroll down
            zoom = zoom * scaleFactor;
            project.activeLayer.scale(scaleFactor);
           // alert("zoom in");
        }
            
    });
        
        

    $scope.clickTest = function () {

        alert("click test");

        var firstPath = new Path.Circle();

        firstPath.position = new Point();
        first.radius = 35;


        firstPath.strokeColor = '#ff0000';
        firstPath.fillColor = 'blue';

    }



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


    function initDom() {
        text = "<PcGts><Metadata>";
        text = text + "<Creator>hao.wei@unifr.ch</Creator>";
        text = text + "<Created>15.07.2014</Created>";
        text = text + "<LastChange>16.07.2014</LastChange>";
        text = text + "<Comment></Comment>";
        text = text + "</Metadata>";
        text = text + "<Page></Page>";
        text = text + "</PcGts>";
        xmlDoc = loadXMLString(text);

        var d = new Date();
        var created = xmlDoc.getElementsByTagName("Created")[0];
        newCreated = xmlDoc.createTextNode(d);
        created.appendChild(newCreated);
        var lastChange = xmlDoc.getElementsByTagName("LastChange")[0];
        newCreated = xmlDoc.createTextNode(d);
        lastChange.appendChild(newCreated);

        newAttImgName = xmlDoc.createAttribute("imageFilename");
        newAttImgName.nodeValue = imgName;
        newAttImgHgt = xmlDoc.createAttribute("imageHeight");
        newAttImgHgt.nodeValue = imgHeight;
        newAttImgWd = xmlDoc.createAttribute("imageWidth");
        newAttImgWd.nodeValue = imgWidth;
        var page = xmlDoc.getElementsByTagName("Page")[0];
        page.setAttributeNode(newAttImgWd);
        page.setAttributeNode(newAttImgHgt);
        page.setAttributeNode(newAttImgName);

        newAttId = xmlDoc.createAttribute("pcGtsId");
        newAttId.nodeValue = "";
        newAttLc = xmlDoc.createAttribute("xsi:schemaLocation");
        newAttLc.nodeValue = "http://schema.primaresearch.org/PAGE/gts/pagecontent/2013-07-15 http://schema.primaresearch.org/PAGE/gts/pagecontent/2013-07-15/pagecontent.xsd";
        newAttXMLNS = xmlDoc.createAttribute("xmlns:xsi");
        newAttXMLNS.nodeValue = "http://www.w3.org/2001/XMLSchema-instance";
        var pcGts = xmlDoc.getElementsByTagName("PcGts")[0];
        pcGts.setAttributeNode(newAttXMLNS);
        pcGts.setAttributeNode(newAttLc);
        pcGts.setAttributeNode(newAttId);

        //      alert((new XMLSerializer()).serializeToString(xmlDoc));
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
        newAttID.nodeValue = myPath.id;
        newAttTp = xmlDoc.createAttribute("type");
        switch ($scope.color) {
        case 'green':
            newAttTp.nodeValue = 'textline';
            break;
        case "magenta":
            newAttTp.nodeValue = 'decoration';
            break;
        case "orange":
            newAttTp.nodeValue = 'comment';
            break;
        case "blue":
            newAttTp.nodeValue = 'text';
            break;
        case "white":
            newAttTp.nodeValue = 'page';
            break;
        }
        newTR.setAttributeNode(newAttTp);
        newTR.setAttributeNode(newAttID);
        newTR.setAttributeNode(newAttCus);
        newTR.setAttributeNode(newAttCom);
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
        $('#myImg').click();
    }

    // load new image. Reference to test3.html, or check email "useful posts.."
    $scope.fileNameChanged = function (event) {
        console.log("select file");
        var selectedFile = event.target.files[0];
        var reader = new FileReader();
        //    var imgtag = document.getElementById("myimage");
        //    imgtag.title = selectedFile.name;
        reader.onload = function (event) {
            //    imgtag.src = event.target.result;
            document.getElementById("parzival").src = event.target.result;
            imgName = selectedFile.name;
            init();
        };
        reader.readAsDataURL(selectedFile);
    }
});

myApp.config(function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
});