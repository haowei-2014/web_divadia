var myApp = angular.module('myApp', []);

myApp.controller('simpleController', function ($scope) {
    paper.install(window);
    window.onload = function () {
        init();
        imgName = null;

        function init() {
            paper.setup('canvas');
            raster = new Raster('parzival');
            raster.position = view.center;
            zoom = 0.2;
            project.activeLayer.scale(zoom);
            $scope.polygon = [];
            $scope.mode = 'draw';
            $scope.mode2 = 'draw2';
            $scope.mode3 = 'draw3';
            $scope.mode4 = 'draw4';
            $scope.color = 'green';
            $scope.displayText = true;
            $scope.displayTextLine = true;
            $scope.displayDecoration = true;
            $scope.displayComment = true;
            $scope.displayPage = true;
            myPath = new Path();
            myPath.strokeColor = $scope.color;
            myPath.strokeWidth = 2;
            lastClick = 0;
            pathFinished = true;
            tool = new Tool();
            img = document.getElementById("parzival");
            // Watch out for the height of the canvas, look at it when compute the point-line distance. 
            /*            varcanvas = document.getElementById("canvas");
            canvasHeight = varcanvas.height;*/
            imgWidth = img.width;
            imgHeight = img.height;
            xmlDoc = null;
            mousePosition = document.getElementById("mousePosition");

            currentModify = null;
            currentModifyPts = [];
            currentModifyPt = null;
            currentModifyPtCircle = null;
            currentModifyPtIndex = 0;
            currentModifyInfo = {
                type: "",
                currentModifyPt: null,
                currentModifyPtIndex: 0
            };

            colorText = new Color(0, 0, 1);
            colorTextLine = new Color(0, 0.5019607843137255, 0);
            colorDecoration = new Color(1, 0, 1);
            colorComment = new Color(1, 0.6470588235294118, 0);
            colorPage = new Color(1, 1, 1);
            //    alert($scope.mode);
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
            // test if the mousedown is single click, double click, or drag
            single = true;
            drag = false;
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

        function modify(event) {
            if (single && !drag && ($scope.mode == "modify")) {
                var selectedCandidates = [];
                var layerChildren = project.activeLayer.children;
                for (var i = 0; i < layerChildren.length; i++) {
                    if ((layerChildren[i].className == "Path") && layerChildren[i].contains(event.point)) {
                        selectedCandidates.push(layerChildren[i]);
                    }
                }
                if (selectedCandidates.length == 1) {
                    updateCurrentPolygonInfo(selectedCandidates[0]);
                } else if (selectedCandidates.length == 2) {
                    for (var i = 0; i < selectedCandidates.length; i++) {

                        if (!selectedCandidates[i].strokeColor.equals(colorPage)) {
                            updateCurrentPolygonInfo(selectedCandidates[i]);
                        }
                    }
                } else {
                    for (var i = 0; i < selectedCandidates.length; i++) {
                        if (selectedCandidates[i].strokeColor.equals(colorTextLine)) {
                            updateCurrentPolygonInfo(selectedCandidates[i]);
                        }

                    }
                }
            }

        }


        function draw(event) {
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
                //                myPath.onClick = function (event) {
                //                    updateCurrentPolygonInfo(this);
                //                }
                //myPath.onMouseLeave = function (event) {}              
            }
            $scope.$apply();
        }

        function updateCurrentPolygonInfo(pathSelected) {
            if (currentModify != null) {
                currentModify.fullySelected = false;
                currentModify.fillColor = null;
                currentModify.opacity = 1;
            }
            pathSelected.fullySelected = true;
            pathSelected.fillColor = 'red';
            pathSelected.opacity = 0.1;
            console.log(pathSelected);
            if ($scope.mode == 'modify') {
                currentModify = pathSelected;
                var currentModifyPtsLength = currentModify.segments.length;
                if (currentModifyPts.length != 0)
                    currentModifyPts = [];
                for (var i = 0; i < currentModifyPtsLength; i++) {
                    currentModifyPts.push(currentModify.segments[i].point);
                }
            }
        }


        // if you use the modify mode and insert a point, do it and update the current polygon information 
        tool.onMouseDown = function (event) {
            if (($scope.mode == 'modify') && (currentModifyInfo.type == "insert") && (currentModifyPt != null)) {
                currentModify.insert(currentModifyInfo.currentModifyPtIndex + 1, event.point);
                updateCurrentPolygonInfo(currentModify);
            }
        }

        // modify the polygon or pan the image 
        tool.onMouseDrag = function (event) {
            if (currentModifyPtCircle != null)
                currentModifyPtCircle.remove();
            // if modify point exists, check its type and the modify it.
            if (currentModifyPt != null) {
                if (currentModifyInfo.type == "modify") {
                    currentModify.segments[currentModifyInfo.currentModifyPtIndex].point = event.point;
                } else {
                    currentModify.segments[currentModifyInfo.currentModifyPtIndex + 1].point = event.point;
                }
                updateDOMModify();
            } else { // pan the image
                var vector = event.delta;
                project.activeLayer.position = new Point(project.activeLayer.position.x + vector.x,
                    project.activeLayer.position.y + vector.y);
            }
        }


        // update the DOM after modifying the polygon
        function updateDOMModify() {
            $scope.polygon = [];
            for (var i = 0; i < currentModify.segments.length; i++) {
                var xcoordinateImage = Math.round((currentModify.segments[i].point.x - raster.bounds.x) / zoom);
                var ycoordinateImage = Math.round((currentModify.segments[i].point.y - raster.bounds.y) / zoom);
                //      console.log(xcoordinateImage);
                //      console.log(ycoordinateImage);
                if (xcoordinateImage < 0 || xcoordinateImage >= imgWidth || ycoordinateImage < 0 || ycoordinateImage >= imgHeight) {
                    $("#xyClick").html("Out of the image!");
                } else {
                    $scope.polygon.push({
                        x: xcoordinateImage,
                        y: ycoordinateImage,
                    });
                }
            }
            myPath = currentModify;
            updateDOM();
            console.log("currentModify.segments: " + currentModify.segments);
            console.log($scope.polygon);
        }


        tool.onMouseMove = function (event) {
            //   mousePosition.innerHTML("x: " + Math.round(event.point.x) + ", y: " + Math.round(event.point.y));

            // there are two types of modification: modify the existing corners of the polygon,
            // or insert a point within the existing boundary. Both are to be done with drag.
            if ($scope.mode == 'modify') {
                //      if (currentModify != null) {
                currentModifyPt = null;
                // check the corners of the polygon, to see if any one is close enough to the cursor
                for (var i = 0; i < currentModifyPts.length; i++) {
                    if (lineDistance(event.point, currentModifyPts[i]) < 20) {
                        //   console.log("enough");
                        currentModifyPtCircle = new Path.Circle({
                            center: [currentModifyPts[i].x, currentModifyPts[i].y],
                            radius: 3
                        });
                        currentModifyPtCircle.strokeColor = '#ff0000';
                        currentModifyPtCircle.fillColor = 'blue';
                        currentModifyPtCircle.removeOnMove();
                        currentModifyInfo.currentModifyPtIndex = i;
                        currentModifyPt = new Point(currentModifyPts[i].x, currentModifyPts[i].y);
                        currentModifyInfo.currentModifyPt = currentModifyPt;
                        currentModifyInfo.type = "modify";
                    }
                }
                // if no corner of the polygon is selected, check if the cursor is close enough to any boundary
                if (currentModifyPt == null) {
                    var distanceTmp = 100000;
                    var perpendicularInfo = null;
                    for (var i = 0; i < currentModifyPts.length; i++) {
                        if (i < currentModifyPts.length - 1)
                            perpendicularInfoTmp = pointLineDistance(currentModifyPts[i], currentModifyPts[i + 1],
                                event.point);
                        else
                            perpendicularInfoTmp = pointLineDistance(currentModifyPts[i], currentModifyPts[0],
                                event.point);
                        // find the closest boundary to the cursor
                        if ((perpendicularInfoTmp != null) && (perpendicularInfoTmp.distance < distanceTmp)) {
                            perpendicularInfo = perpendicularInfoTmp;
                            distanceTmp = perpendicularInfoTmp.distance;
                            currentModifyInfo.currentModifyPtIndex = i;
                        }
                    }
                    if ((perpendicularInfo != null) && (perpendicularInfo.distance < 10)) {
                        currentModifyPtCircle = new Path.Circle({
                            center: [perpendicularInfo.x, perpendicularInfo.y],
                            radius: 3
                        });
                        currentModifyPtCircle.strokeColor = '#ff0000';
                        currentModifyPtCircle.fillColor = 'blue';
                        currentModifyPtCircle.removeOnMove();
                        currentModifyPt = new Point(perpendicularInfo.x, perpendicularInfo.y);
                        currentModifyInfo.currentModifyPt = currentModifyPt;
                        currentModifyInfo.type = "insert";
                    }
                }
                //       }
            }
            //        console.log(currentModifyPt);
        }


        // distance between a point and a line
        function pointLineDistance(point1, point2, cursor) {
            var p1x = point1.x;
            var p1y = 800 - point1.y;
            var p2x = point2.x;
            var p2y = 800 - point2.y;
            var cx = cursor.x;
            var cy = 800 - cursor.y;

            // compute the perpendicular distance 
            var a = (p2y - p1y) / (p2x - p1x); // slope
            var c = a * p1x * (-1) + p1y;
            var b = -1;
            var distance = Math.abs(a * cx + b * cy + c) / Math.sqrt(a * a + b * b);

            // computer the perpendicular intersection
            var pa = 1 / a * (-1); // perpendicular slope (a)
            var x = ((-1) * pa * cx - p1y + a * p1x + cy) / (a - pa);
            var y = a * (x - p1x) + p1y;
            y = 800 - y;

            var lower = (p1x >= p2x) ? p2x : p1x;
            var higher = (p1x < p2x) ? p2x : p1x;
            if ((x >= lower) && (x <= higher)) {
                return {
                    x: x,
                    y: y,
                    distance: distance
                };
            } else {
                return null;
            }
        }


        // distance between 2 points.
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
            view.draw();
        });*/

        /*canvas.addEventListener("mousewheel", function (e) {

            //        if (currentModifyPt != null)
            //            currentModifyPt.remove();

            //   alert("mousewheel");
            e.preventDefault();
            var direction = e.deltaY;
            var scaleFactor = 1.5;


            if (direction < 0) {
                zoom = zoom * scaleFactor;
                project.activeLayer.scale(scaleFactor, new Point(e.offsetX, e.offsetY));

            } else {
                zoom = zoom / scaleFactor;
                project.activeLayer.scale(1 / scaleFactor, new Point(e.offsetX, e.offsetY));

            }


            view.draw();
        });*/

        $('#canvas').bind('mousewheel DOMMouseScroll MozMousePixelScroll',
            function (e) {
                var delta = 0;
                e.preventDefault();
                var scaleFactor = 1.5;

                if (e.offsetX == undefined) // this works for Firefox
                {
                    xpos = e.originalEvent.layerX;
                    ypos = e.originalEvent.layerY;
                    console.log(xpos);
                    console.log(ypos);
                } else // works in Google Chrome
                {
                    xpos = e.offsetX;
                    ypos = e.offsetY;
                }

                if (e.type == 'mousewheel') { //this is for chrome/IE
                    delta = e.originalEvent.wheelDelta;
                } else if (e.type == 'DOMMouseScroll') { //this is for FireFox
                    delta = e.originalEvent.detail * -1; //FireFox reverses the scroll so we force to reverse.
                }
                if (delta > 0) { //scroll up
                    zoom = zoom * scaleFactor;
                    project.activeLayer.scale(scaleFactor, new Point(xpos, ypos));
                    //      project.activeLayer.scale(zoom, zoomCenter);
                } else if (delta < 0) { //scroll down                   
                    zoom = zoom / scaleFactor;
                    project.activeLayer.scale(1 / scaleFactor, new Point(xpos, ypos));
                    //       project.activeLayer.scale(zoom, zoomCenter);
                }
                view.draw();
            });


        $scope.clickTest = function () {

            alert("click test");

            var layerChildren = project.activeLayer.children;
            for (var i = 0; i < layerChildren.length; i++) {
                if (layerChildren[i].className == "Path") {
                    if (layerChildren[i].data.idXML)
                        console.log(layerChildren[i].data.idXML);
                    else {
                        console.log("not exist");
                        console.log(layerChildren[i]);
                    }
                }
            }
        }


        $scope.removePolygon = function () {      
            var page = xmlDoc.getElementsByTagName("Page")[0];
            var textRegions = page.childNodes;
            for (var i = 0; i < textRegions.length; i++) {
                var idXML = textRegions[i].getAttribute("id");
                var idXMLPath = currentModify.data.idXML;
                if ((idXML == idXMLPath) || (idXML == myPath.id)) {
                    page.removeChild(textRegions[i]);
                }
            }
            currentModify.remove();
        }


        $scope.modeChange = function () {
            if ($scope.mode == 'draw') {
                document.getElementById("drawForm").style.display = "";
                document.getElementById("modifyForm").style.display = "none";
                document.getElementById("displayForm").style.display = "none";
            } else if ($scope.mode == 'modify') {
                document.getElementById("drawForm").style.display = "none";
                document.getElementById("modifyForm").style.display = "";
                document.getElementById("displayForm").style.display = "none";
            } else {
                document.getElementById("drawForm").style.display = "none";
                document.getElementById("modifyForm").style.display = "none";
                document.getElementById("displayForm").style.display = "";
            }
        }


        $scope.displayChange = function () {
            //       console.log(project.activeLayer.children);
            var layerChildren = project.activeLayer.children;
            for (var i = 0; i < layerChildren.length; i++) {
                if (layerChildren[i].className == "Path") {
                    if (layerChildren[i].strokeColor.equals(colorTextLine)) {
                        if ($scope.displayTextLine)
                            layerChildren[i].visible = true;
                        else
                            layerChildren[i].visible = false;
                    }
                    if (layerChildren[i].strokeColor.equals(colorText)) {
                        if ($scope.displayText)
                            layerChildren[i].visible = true;
                        else
                            layerChildren[i].visible = false;
                    }
                    if (layerChildren[i].strokeColor.equals(colorDecoration)) {
                        if ($scope.displayDecoration)
                            layerChildren[i].visible = true;
                        else
                            layerChildren[i].visible = false;
                    }
                    if (layerChildren[i].strokeColor.equals(colorComment)) {
                        if ($scope.displayComment)
                            layerChildren[i].visible = true;
                        else
                            layerChildren[i].visible = false;
                    }
                    if (layerChildren[i].strokeColor.equals(colorPage)) {
                        if ($scope.displayPage)
                            layerChildren[i].visible = true;
                        else
                            layerChildren[i].visible = false;
                    }
                }
            }
            view.draw();
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
                myPath.strokeWidth = 2;
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
                myPath.data.idXML = textRegions[i].getAttribute("id");
                myPath.closed = true;
                //                myPath.onClick = function (event) {
                //                    updateCurrentPolygonInfo(this);
                //                }
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
            var textRegions = page.childNodes;
            for (var i = 0; i < textRegions.length; i++) {
                var idXML = textRegions[i].getAttribute("id");
                var idXMLPath = myPath.data.idXML;
                if ((idXML == idXMLPath) || (idXML == myPath.id)) {
                    console.log("equal! Remove it!");
                    page.removeChild(textRegions[i]);
                }
            }

            newCd = xmlDoc.createElement("Coords");
            for (var i = 0; i < $scope.polygon.length; i++) {
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
            if (myPath.data.idXML)
                newAttID.nodeValue = myPath.data.idXML;
            else
                newAttID.nodeValue = myPath.id;
            newAttTp = xmlDoc.createAttribute("type");
            if (myPath.strokeColor.equals(colorTextLine))
                newAttTp.nodeValue = 'textline';
            if (myPath.strokeColor.equals(colorText))
                newAttTp.nodeValue = 'text';
            if (myPath.strokeColor.equals(colorDecoration))
                newAttTp.nodeValue = 'decoration';
            if (myPath.strokeColor.equals(colorComment))
                newAttTp.nodeValue = 'comment';
            if (myPath.strokeColor.equals(colorPage))
                newAttTp.nodeValue = 'page';
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
    }

});

myApp.config(function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
});