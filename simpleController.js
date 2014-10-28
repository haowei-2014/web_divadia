var myApp = angular.module('myApp', []);

myApp.controller('simpleController', function ($scope) {
    paper.install(window);
    window.onload = function () {
        imgName = "csg562-022.png";
        myEmail = "hao.wei@unifr.ch";
        init();

        function init() {
            paper.setup('canvas');

            img = document.getElementById("parzival");
            // Watch out for the height of the canvas, look at it when compute the point-line distance. 
            //    varcanvas = document.getElementById("canvas");
            //   varcanvas.width = window.innerWidth * 7.5 /12;
            //   alert("window.innerWidth: " + window.innerWidth);
            //   alert("canvas width: " + varcanvas.width);

            imgWidth = img.naturalWidth;
            imgHeight = img.naturalHeight;
            
            zoom = 0.3;
            raster = new Raster('parzival');
            raster.position = view.center;

            project.activeLayer.scale(zoom);
            $scope.polygon = [];
            color = 'green';
            $scope.regions = [
                {
                    name: 'text line',
                    color: new Color(0, 0.5019607843137255, 0)
                },
                {
                    name: 'text block',
                    color: new Color(0, 0, 1)
                },
                {
                    name: 'decoration',
                    color: new Color(1, 0, 1)
                },
                {
                    name: 'comment',
                    color: new Color(1, 0.6470588235294118, 0)
                },
                {
                    name: 'page',
                    color: new Color(1, 1, 1)
                }
    ];
            $scope.myRegion = $scope.regions[0];
            $scope.shapes = [
                {
                    name: 'polygon',
                },
                {
                    name: 'rectangle',
                }
    ];
            $scope.myShape = $scope.shapes[0];
            $scope.displayText = true;
            $scope.displayTextLine = true;
            $scope.displayDecoration = true;
            $scope.displayComment = true;
            $scope.displayPage = true;
            $scope.$apply();
            currentDrawPath = new Path();
            currentDrawPath.strokeColor = color;
            currentDrawPath.strokeWidth = 2;
            currentDrawPathLastPoint = null;
            fromRectangle = null;
            opacityPath = 0.1;
            lastClick = 0;
            pathFinished = true;
            tool = new Tool();
            xmlDoc = null;
            mousePosition = $("#mousePosition");
            srcImage = null;

            modeModify = false;
            modeDraw = false;
            currentModify = null;
            previousModify = new Path();
            currentModifyPts = []; // currentModifyPts contains all vertexes on the currently modifying polygon
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

            showInfo = true;
            $(document).ready(function () {
                $("#imgName").html("Name: " + imgName + ". ");
                $("#imgWidth").html("Width: " + imgWidth + " pixels. ");
                $("#imgHeight").html("Height: " + imgHeight + " pixels. ");
            });

            singleClick = true;
            doubleClick = false;
            drag = false;
            hasLastChange = false;
            
            drawRegionGlyph = document.getElementById("drawTextLineGlyph");
            drawShapeGlyph = document.getElementById("drawPolygonGlyph");
            shape = "polygon";
            showTextLineFlag = false;
            showTextBlockFlag = false;
            showDecorationFlag = false;
            showCommentFlag = false;
            showPageFlag = false;
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
            singleClick = true;
            doubleClick = false;
            drag = false;
            var d = new Date();
            var t = d.getTime();
            if (event.delta.length != 0) {
                drag = true;
                singleClick = false;
                doubleClick = false;
                document.getElementById("canvas").style.cursor = "auto";
            } else if (t - lastClick < 200) {
                console.log("double"); // double is a single plus a double, bad implementation!
                doubleClick = true;
                singleClick = false;
                drag = false;
            } else {
                console.log("single");
                singleClick = true;
                doubleClick = false;
                drag = false;
            }
            lastClick = t;
            if (!modeModify){
                if (singleClick || doubleClick)
                    draw(event);
            }
        }
        function draw(event) {
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
            //var scope = $('#xyClick').scope();

            // update the point information of the polygon
            if (xClick < 0 || xClick >= imgWidth || yClick < 0 || yClick >= imgHeight) {
                $(document).ready(function () {
                    $("#xyClick").html("Out of the image! ");
                });
            } else if (singleClick) {
                modeDraw = true;
                if (pathFinished) {
                    if (shape == "polygon") {
                        currentDrawPath = new Path();
                        currentDrawPath.add(event.point);
                        currentDrawPathLastPoint = new Point(xClick, yClick);
                        currentDrawPath.data.shape = "polygon";
                        $scope.polygon = [];
                        $scope.polygon.push({
                            x: xClick,
                            y: yClick
                        });
                    } else {
                        currentDrawPath = new Path.Rectangle(event.point, event.point);
                        fromRectangle = new Point(xClick, yClick);
                        currentDrawPath.data.shape = "rectangle";
                        $scope.polygon = [];
                    }
                    currentDrawPath.strokeColor = color;
                    currentDrawPath.strokeWidth = 2;
                    pathFinished = false;
                } else {
                    if (currentDrawPath.data.shape == "polygon") {
                        currentDrawPath.add(event.point);
                        currentDrawPathLastPoint = new Point(xClick, yClick);
                        $(document).ready(function () {
                            $("#xyClick").html("x: " + xClick + ", y: " + yClick + ". ");
                        });
                        $scope.polygon.push({
                            x: xClick,
                            y: yClick
                        });
                    } else {
                        currentDrawPath.remove;
                        var xShow = Math.round(fromRectangle.x * zoom + raster.bounds.x);
                        var yShow = Math.round(fromRectangle.y * zoom + raster.bounds.y);
                        //         currentDrawPath = new Path.Rectangle(new Point(xShow, yShow), event.point);
                        currentDrawPath = new Path();


                        point1Rectangle = new Point(xClick, fromRectangle.y);
                        point2Rectangle = new Point(xClick, yClick);
                        point3Rectangle = new Point(fromRectangle.x, yClick);

                        currentDrawPath.add(new Point(xShow, yShow));
                        currentDrawPath.add(new Point(event.point.x, yShow));
                        currentDrawPath.add(event.point);
                        currentDrawPath.add(new Point(xShow, event.point.y));

                        currentDrawPath.data.shape = "rectangle";
                        currentDrawPath.strokeColor = color;
                        currentDrawPath.strokeWidth = 2;
                        currentDrawPath.closed = true;
                        pathFinished = true;
                        $(document).ready(function () {
                            $("#xyClick").html("x: " + xClick + ", y: " + yClick);
                        });
                        $scope.polygon.push({
                            x: fromRectangle.x,
                            y: fromRectangle.y
                        }, {
                            x: xClick,
                            y: fromRectangle.y
                        }, {
                            x: xClick,
                            y: yClick
                        }, {
                            x: fromRectangle.x,
                            y: yClick
                        });
                        $scope.$apply();
                        if (xmlDoc == null)
                            initDom();
                        updateDOMDraw();
                        fromRectangle = null;
                    }

                }
            }

            // if double click, then the path is finished.
            if (doubleClick && currentDrawPath.data.shape == "polygon") {
                currentDrawPath.closed = true;
                pathFinished = true;
                modeDraw = false;
                currentDrawPathLastPoint = null;
                if (xmlDoc == null)
                    initDom();
                updateDOMDraw();
            }
            $scope.$apply();
        }

        function updateCurrentModifyInfo(currentModify) {
            // previousModify is not highlighted anymore.
            previousModify.fullySelected = false;
            previousModify.fillColor = null;
            previousModify.opacity = 1;
            // if the polygon is text line, decoration, or comment, highlight it,
            // because highlighting page or text block will sometimes make the broswer dead.
            if (currentModify != null && modeModify) {
                if (currentModify.strokeColor.equals(colorTextLine) ||
                    currentModify.strokeColor.equals(colorDecoration) ||
                    currentModify.strokeColor.equals(colorComment)) {
                    currentModify.fullySelected = true;
                    currentModify.fillColor = 'red';
                    currentModify.opacity = opacityPath;
                }
            }

            previousModify = currentModify;
            currentModifyPtsLength = currentModify.segments.length;
            if (currentModifyPts.length != 0)
                currentModifyPts = [];
            for (var i = 0; i < currentModifyPtsLength; i++) {
                currentModifyPts.push(currentModify.segments[i].point);
            }
        }


        // if you use the modify mode and insert a point, do it and update the current polygon information 
        tool.onMouseDown = function (event) {
            if ((currentModifyInfo.type == "insert") && (modeModify)) {
                currentModify.insert(currentModifyInfo.currentModifyPtIndex + 1, event.point);
                updateCurrentModifyInfo(currentModify);
                updateDOMModify();
            }
        }

        // modify the polygon or pan the image 
        tool.onMouseDrag = function (event) {
            if (currentModifyPtCircle != null)
                currentModifyPtCircle.remove();
            // if modify point exists, check its type and the modify it.
            if (modeModify) {
                if (currentModifyInfo.type == "modify") {
                    if (currentModify.data.shape == "polygon")
                        currentModify.segments[currentModifyInfo.currentModifyPtIndex].point = event.point;
                    else {
                        if (currentModifyInfo.currentModifyPtIndex == 0) {
                            currentModify.segments[3].point.x = event.point.x;
                            currentModify.segments[1].point.y = event.point.y;
                        } else if (currentModifyInfo.currentModifyPtIndex == 1) {
                            currentModify.segments[0].point.y = event.point.y;
                            currentModify.segments[2].point.x = event.point.x;
                        } else if (currentModifyInfo.currentModifyPtIndex == 2) {
                            currentModify.segments[1].point.x = event.point.x;
                            currentModify.segments[3].point.y = event.point.y;
                        } else if (currentModifyInfo.currentModifyPtIndex == 3) {
                            currentModify.segments[2].point.y = event.point.y;
                            currentModify.segments[0].point.x = event.point.x;
                        }
                        currentModify.segments[currentModifyInfo.currentModifyPtIndex].point = event.point;
                    }
                } else {
                    currentModify.segments[currentModifyInfo.currentModifyPtIndex + 1].point = event.point;
                }
                updateDOMModify();
            } else { // pan the image
                document.getElementById("canvas").style.cursor = "all-scroll";
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
                    $("#xyClick").html("");
                    $scope.polygon.push({
                        x: xcoordinateImage,
                        y: ycoordinateImage,
                    });
                }
            }
            //          currentDrawPath = currentModify;
            //           console.log($scope.polygon);

            var page = xmlDoc.getElementsByTagName("Page")[0];
            var textRegions = page.childNodes;
            var currentTextRegion = null;

            if (currentModify.data.idXML) {
                for (var i = 0; i < textRegions.length; i++) {
                    var idXML = textRegions[i].getAttribute("id");
                    var idPathData = currentModify.data.idXML;
                    if (idXML == idPathData) {
                        currentTextRegion = textRegions[i];
                        // this part could be improved. Inserting a point may save time.
                        currentTextRegion.removeChild(currentTextRegion.childNodes[0]);
                    }
                }
            } else {
                for (var i = 0; i < textRegions.length; i++) {
                    var idXML = textRegions[i].getAttribute("id");
                    var idPath = currentModify.id;
                    if (idXML == idPath) {
                        currentTextRegion = textRegions[i];
                        // this part could be improved. Inserting a point may save time.
                        currentTextRegion.removeChild(currentTextRegion.childNodes[0]);
                    }
                }
            }
            newCoords = xmlDoc.createElement("Coords");
            for (var i = 0; i < $scope.polygon.length; i++) {
                newPt = xmlDoc.createElement("Point");
                newPt.setAttribute("y", $scope.polygon[i].y);
                newPt.setAttribute("x", $scope.polygon[i].x);
                newCoords.appendChild(newPt);
            }
            if (currentTextRegion == null) {
                alert("currentTextRegion is null!");
            } else
                currentTextRegion.appendChild(newCoords);
            hasLastChange = true;
        }

        tool.onMouseMove = function (event) {
            // there are two types of modification: modify the existing corners of the polygon,
            // or insert a point within the existing boundary. Both are to be done with drag.
            mousePosition.html("x: " + Math.round(event.point.x) + ", y: " + Math.round(event.point.y));
            searchPath(event);
            if (!modeDraw)
                searchCurrentModifyPt(event);             
        }
        
        function searchCurrentModifyPt(event) {
            currentModifyPtCircle = new Path.Circle({
                center: new Point(0, 0),
                radius: 3,
                fillColor: 'yellow'
            });  
            currentModifyPtCircle.removeOnMove();
            var layerChildren = project.activeLayer.children;
            var nearestDistance = 100000;
            for (var i = 0; i < layerChildren.length; i++) {
                console.log();
                if (layerChildren[i].className == "Path") {
                    // search among paths that are not a single point, drawn by users, and already closed.
                    if (layerChildren[i].segments.length > 1 && 
                        layerChildren[i].strokeColor && 
                        layerChildren[i].closed) {
                        var currentModifyPtTmp = layerChildren[i].getNearestPoint(event.point);
                        var nearestDistanceTmp = lineDistance(event.point, currentModifyPtTmp);
                        if (nearestDistanceTmp < nearestDistance) {
                            nearestDistance = nearestDistanceTmp;
                            currentModifyPt = currentModifyPtTmp;
                            currentModify = layerChildren[i];
                        }
                    }
                }
            }
            if (nearestDistance < 20) {
                modeModify = true;
                updateCurrentModifyInfo(currentModify);
                // find the nearest vertex to the found point, if they are close enough,
                // reset the found point to the vertex.
                var p2pDistance = 10000;
                var cornerFound = false;
                for (var i = 0; i < currentModifyPtsLength; i++) {
                    var p2pDistanceTmp = lineDistance(currentModifyPt, currentModifyPts[i]);
                    if (p2pDistanceTmp < 20 && p2pDistanceTmp < p2pDistance){
                        p2pDistance = p2pDistanceTmp;
                        currentModifyPt = currentModifyPts[i];
                        currentModifyInfo.currentModifyPt = currentModifyPt;
                        currentModifyInfo.type = "modify";
                        currentModifyInfo.currentModifyPtIndex = i;
                        cornerFound = true;
                    }
                }
                if (!cornerFound) {
                    for (var i = 0; i < currentModifyPtsLength; i++) {
                        var j = i+1;
                        if (i == (currentModifyPtsLength-1))
                            j = 0;
                        var path = new Path.Rectangle(currentModifyPts[i], currentModifyPts[j]);
                        if (path.contains(currentModifyPt)){
                            currentModifyInfo.currentModifyPtIndex = i;
                            currentModifyInfo.currentModifyPt = currentModifyPt;
                            currentModifyInfo.type = "insert";
                            path.remove();
                            break;
                        }
                        path.remove();
                    }                    
                }
                // make the yellow circle centered at the currentModifyPt 
                currentModifyPtCircle.position = currentModifyPt;      
                if (currentModify != previousModify)
                     updateCurrentModifyInfo(currentModify);
            } else {
                if (previousModify != null) {
                    previousModify.fullySelected = false;
                    previousModify.fillColor = null;
                    previousModify.opacity = 1;
                }
                modeModify = false;
            }           
            view.draw();
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
                var zoomTrail = 0;
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
                    zoomTrail = zoom * scaleFactor;
                    if (zoomTrail < 5) {
                        zoom = zoom * scaleFactor;
                        project.activeLayer.scale(scaleFactor, new Point(xpos, ypos));
                    }
                } else if (delta < 0) { //scroll down 
                    zoomTrail = zoom / scaleFactor;
                    if (zoomTrail > 0.1) {
                        zoom = zoom / scaleFactor;
                        project.activeLayer.scale(1 / scaleFactor, new Point(xpos, ypos));
                    }
                }
                view.update();
            });

        $scope.test = function () {
            var path = new Path();
            path.strokeColor = 'black';
            path.add(new Point(30, 75));
            path.add(new Point(30, 25));
            path.add(new Point(80, 25));
            path.add(new Point(80, 75));
            path.closed = true;

            
            alert(path.getOffsetOf(new Point(80, 25)));
        }


        $scope.removePolygon = function () {
            var page = xmlDoc.getElementsByTagName("Page")[0];
            var textRegions = page.childNodes;
            for (var i = 0; i < textRegions.length; i++) {
                var idXML = textRegions[i].getAttribute("id");
                var idXMLPath = currentModify.data.idXML;
                if ((idXML == idXMLPath) || (idXML == currentDrawPath.id)) {
                    page.removeChild(textRegions[i]);
                }
            }
            currentModify.remove();
        }

        $scope.editComments = function () {
            /*console.log($scope.comments);

            var page = xmlDoc.getElementsByTagName("Page")[0];
            var textRegions = page.childNodes;
            var idXMLPath;
            for (var i = 0; i < textRegions.length; i++) {
                var idXML = textRegions[i].getAttribute("id");
                if ($scope.mode == "draw")
                    idXMLPath = currentDrawPath.data.idXML;
                else
                    idXMLPath = currentModify.data.idXML;
                if ((idXML == idXMLPath) || (idXML == currentDrawPath.id)) {
                    console.log("Found it!");
                    textRegions[i].setAttribute("comments", $scope.comments);
                }
            }*/
        }

        $scope.drawTextLine = function () {
            	color = 'green';
                drawRegionGlyph.className = "hidden";
            	document.getElementById("drawTextLineGlyph").className = "glyphicon glyphicon-ok";
                drawRegionGlyph = document.getElementById("drawTextLineGlyph");
        }      
        
        $scope.drawTextBlock = function () {
            	color = 'blue';
                drawRegionGlyph.className = "hidden";
            	document.getElementById("drawTextBlockGlyph").className = "glyphicon glyphicon-ok";
                drawRegionGlyph = document.getElementById("drawTextBlockGlyph");
        }
        
        $scope.drawDecoration = function () {
            	color = 'magenta';
                drawRegionGlyph.className = "hidden";
            	document.getElementById("drawDecorationGlyph").className = "glyphicon glyphicon-ok";
                drawRegionGlyph = document.getElementById("drawDecorationGlyph");
        }
        
        $scope.drawComment = function () {
            	color = 'orange';
                drawRegionGlyph.className = "hidden";
            	document.getElementById("drawCommentGlyph").className = "glyphicon glyphicon-ok";
                drawRegionGlyph = document.getElementById("drawCommentGlyph");
        }
        
        $scope.drawPage = function () {
            	color = 'white';
                drawRegionGlyph.className = "hidden";
            	document.getElementById("drawPageGlyph").className = "glyphicon glyphicon-ok";
                drawRegionGlyph = document.getElementById("drawPageGlyph");
        }
        
        $scope.drawPolygon = function () {
            	shape = "polygon";
                drawShapeGlyph.className = "hidden";
            	document.getElementById("drawPolygonGlyph").className = "glyphicon glyphicon-ok";
                drawShapeGlyph = document.getElementById("drawPolygonGlyph");
        }
        
        $scope.drawRectangle = function () {
            	shape = 'rectangle';
                drawShapeGlyph.className = "hidden";
            	document.getElementById("drawRectangleGlyph").className = "glyphicon glyphicon-ok";
                drawShapeGlyph = document.getElementById("drawRectangleGlyph");
        }
        
        $scope.showTextLine = function () {
            if (showTextLineFlag){
                document.getElementById("showTextLineGlyph").className = "glyphicon glyphicon-ok";
            }
            else
                document.getElementById("showTextLineGlyph").className = "hidden";
            var layerChildren = project.activeLayer.children;
            for (var i = 0; i < layerChildren.length; i++) {
                if (layerChildren[i].className == "Path" && layerChildren[i].strokeColor != null) {
                    if (layerChildren[i].strokeColor.equals(colorTextLine)) {
                        if (showTextLineFlag)
                            layerChildren[i].visible = true;
                        else
                            layerChildren[i].visible = false;
                    }
                }
            }
            view.draw();
            showTextLineFlag = !showTextLineFlag;
        }
        
        $scope.showTextBlock = function () {
            if (showTextBlockFlag){
                document.getElementById("showTextBlockGlyph").className = "glyphicon glyphicon-ok";
            }
            else
                document.getElementById("showTextBlockGlyph").className = "hidden";
            var layerChildren = project.activeLayer.children;
            for (var i = 0; i < layerChildren.length; i++) {
                if (layerChildren[i].className == "Path" && layerChildren[i].strokeColor != null) {
                    if (layerChildren[i].strokeColor.equals(colorText)) {
                        if (showTextBlockFlag)
                            layerChildren[i].visible = true;
                        else
                            layerChildren[i].visible = false;
                    }
                }
            }
            view.draw();
            showTextBlockFlag = !showTextBlockFlag;
        }
        
        $scope.showDecoration = function () {
            if (showDecorationFlag){
                document.getElementById("showDecorationGlyph").className = "glyphicon glyphicon-ok";
            }
            else
                document.getElementById("showDecorationGlyph").className = "hidden";
            var layerChildren = project.activeLayer.children;
            for (var i = 0; i < layerChildren.length; i++) {
                if (layerChildren[i].className == "Path" && layerChildren[i].strokeColor != null) {
                    if (layerChildren[i].strokeColor.equals(colorDecoration)) {
                        if (showDecorationFlag)
                            layerChildren[i].visible = true;
                        else
                            layerChildren[i].visible = false;
                    }
                }
            }
            view.draw();
            showDecorationFlag = !showDecorationFlag;
        }
        
        $scope.showComment = function () {
            if (showCommentFlag){
                document.getElementById("showCommentGlyph").className = "glyphicon glyphicon-ok";
            }
            else
                document.getElementById("showCommentGlyph").className = "hidden";
            var layerChildren = project.activeLayer.children;
            for (var i = 0; i < layerChildren.length; i++) {
                if (layerChildren[i].className == "Path" && layerChildren[i].strokeColor != null) {
                    if (layerChildren[i].strokeColor.equals(colorComment)) {
                        if (showCommentFlag)
                            layerChildren[i].visible = true;
                        else
                            layerChildren[i].visible = false;
                    }
                }
            }
            view.draw();
            showCommentFlag = !showCommentFlag;
        }
        
        $scope.showPage = function () {
            if (showPageFlag){
                document.getElementById("showPageGlyph").className = "glyphicon glyphicon-ok";
            }
            else
                document.getElementById("showPageGlyph").className = "hidden";
            var layerChildren = project.activeLayer.children;
            for (var i = 0; i < layerChildren.length; i++) {
                if (layerChildren[i].className == "Path" && layerChildren[i].strokeColor != null) {
                    if (layerChildren[i].strokeColor.equals(colorPage)) {
                        if (showPageFlag)
                            layerChildren[i].visible = true;
                        else
                            layerChildren[i].visible = false;
                    }
                }
            }
            view.draw();
            showPageFlag = !showPageFlag;
        }
    
        // import the ground truth
        $scope.importGT = function () {
            // click the <input type = 'file'> by program

            $(document).ready(function () {
                $('#myInput').click();
            });
        }

        $(document).ready(function () {
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
        });



        function updateDOMDraw() {
            var page = xmlDoc.getElementsByTagName("Page")[0];
            newCd = xmlDoc.createElement("Coords");
            for (var i = 0; i < $scope.polygon.length; i++) {
                newPt = xmlDoc.createElement("Point");
                newPt.setAttribute("y", $scope.polygon[i].y);
                newPt.setAttribute("x", $scope.polygon[i].x);
                newCd.appendChild(newPt);
            }
            newTR = xmlDoc.createElement("TextRegion");
            newTR.setAttribute("comments", "");
            newTR.setAttribute("custom", "0");
            newTR.setAttribute("id", currentDrawPath.id);
            if (currentDrawPath.strokeColor.equals(colorTextLine))
                newTR.setAttribute("type", "textline");
            if (currentDrawPath.strokeColor.equals(colorText))
                newTR.setAttribute("type", "text");
            if (currentDrawPath.strokeColor.equals(colorDecoration))
                newTR.setAttribute("type", "decoration");
            if (currentDrawPath.strokeColor.equals(colorComment))
                newTR.setAttribute("type", "comment");
            if (currentDrawPath.strokeColor.equals(colorPage))
                newTR.setAttribute("type", "page");
            newTR.setAttribute("id", currentDrawPath.id);
            newTR.appendChild(newCd);
            page.appendChild(newTR);
            hasLastChange = true;
        }


        $scope.exportGT = function () {
            if (xmlDoc != null) {
                if (hasLastChange)
                    editLastChange();
                if (currentModify != null) {
                    updateDOMModify();
                }
                var textToWrite = (new XMLSerializer()).serializeToString(xmlDoc);
                //     alert(textToWrite);
                var textFileAsBlob = new Blob([textToWrite], {
                    type: 'text/xml'
                });
                //       var fileNameToSaveAs = document.getElementById("inputFileNameToSaveAs").value;
                var fileNameToSaveAs = imgName.substring(0, imgName.indexOf('.')) + "_" + myEmail + ".xml";
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
        }

        function destroyClickedElement(event) {
            document.body.removeChild(event.target);
        }


        $scope.importImg = function () {
            $(document).ready(function () {
                $('#myImg').click();
            });
        }

        // load new image. Reference to test3.html, or check email "useful posts.."
        /*$scope.fileNameChanged = function (event) {
            console.log("select file");
            var selectedFile = event.target.files[0];
            var reader = new FileReader();
            //    var imgtag = document.getElementById("myimage");
            //    imgtag.title = selectedFile.name;
            reader.onload = function (event) {
                //    imgtag.src = event.target.result;
                document.getElementById("parzival").src = event.target.result;
                console.log(event.target);
                console.log(event.target.result);
                imgName = selectedFile.name;
                init();
            };
            reader.readAsDataURL(selectedFile);
        }*/
        
        $(document).ready(function (event) {
            // do import event whenever #myInput is closed.
            $("#myImg").change(function (event) {
                var fileToLoad = event.target.files[0];
                var fileReader = new FileReader();
                fileReader.onload = function (event) {
                	document.getElementById("parzival").src = event.target.result;
                	imgName = fileToLoad.name;
                    init();
                };
                fileReader.readAsDataURL(fileToLoad);
                //       var fileText = fileReader.result;
            });
        });
        
        $(document).ready(function (event) {
            // do import event whenever #myInput is closed.
            $("#myImage").change(function (event) {
                var fileToLoad = event.target.files[0];
                var fileReader = new FileReader();
                fileReader.onload = function (event) {
                	document.getElementById("parzival").src = event.target.result;
                	imgName = fileToLoad.name;
                    $('#myModal').modal('hide');
                    init();
                };
                fileReader.readAsDataURL(fileToLoad);
                //       var fileText = fileReader.result;
            });
        });


        $scope.showImgInfo = function () {
            if (showInfo) {
                document.getElementById("imgInfo").style.display = "none";
                document.getElementById("showInfoButton").innerHTML = "Show info";
            } else {
                document.getElementById("imgInfo").style.display = "";
                document.getElementById("showInfoButton").innerHTML = "Hide info";
            }
            showInfo = !showInfo;
        }
        
        $scope.openImage = function () {
        	if ($scope.imageURL != null && $scope.imageURL.length > 0) {
        		console.log($scope.imageURL);
            	var img = new Image();
            	img.onload = function() {
            		document.getElementById("parzival").src= $scope.imageURL;
            		init();
            	}
            	img.src= $scope.imageURL;
        	} else {
        		
        	}
        }

        // draw ground truth on the canvas
        function drawGT(x) {
            xmlDoc = loadXMLString(x);

            var currentDrawPath;
            var page = xmlDoc.getElementsByTagName("Page")[0];
            var textRegions = page.childNodes;

            for (i = 0; i < textRegions.length; i++) {
                var points = textRegions[i].childNodes[0].childNodes;
                currentDrawPath = new Path();
                for (var j = 0; j < points.length; j++) {
                    pointPath = points[j];
                    var x = pointPath.getAttribute("x");
                    var y = pointPath.getAttribute("y");
                    // transform the coordinate to display it
                    x = x * zoom + raster.bounds.x;
                    y = y * zoom + raster.bounds.y;
                    currentDrawPath.add(new Point(x, y));
                }
                if (points.length == 4 && points[0].getAttribute("y") == points[1].getAttribute("y") &&
                    points[1].getAttribute("x") == points[2].getAttribute("x") &&
                    points[2].getAttribute("y") == points[3].getAttribute("y"))
                    currentDrawPath.data.shape = "rectangle";
                else
                    currentDrawPath.data.shape = "polygon";

                // assign color to different classes
                switch (textRegions[i].getAttribute("type")) {
                case "textline":
                    currentDrawPath.strokeColor = 'green';
                    break;
                case "decoration":
                    currentDrawPath.strokeColor = 'magenta';
                    break;
                case "comment":
                    currentDrawPath.strokeColor = 'orange';
                    break;
                case "text":
                    currentDrawPath.strokeColor = 'blue';
                    break;
                case "page":
                    currentDrawPath.strokeColor = 'white';
                    break;
                }
                currentDrawPath.strokeWidth = 2;
                currentDrawPath.data.idXML = textRegions[i].getAttribute("id");
                currentDrawPath.data.comments = textRegions[i].getAttribute("comments");
                currentDrawPath.closed = true;

                /*if (points.length > 1) {
                        

                    var samePoint = 1;

                    if (points.length == 2) {
                        console.log("here");
                        var thisID = textRegions[i].getAttribute("id");
                        console.log(thisID);
                    }
                    pointPath = points[0];
                    var x = pointPath.getAttribute("x");
                    var y = pointPath.getAttribute("y");

                    for (var j = 1; j < points.length; j++) {
                        var pointPathNext = points[j];
                        var xNext = pointPathNext.getAttribute("x");
                        var yNext = pointPathNext.getAttribute("y");

                        if (x == xNext && y == yNext) {
                            samePoint += 1;
                        }
                    }

                    if (samePoint != points.length) {
                        for (var j = 0; j < points.length; j++) {
                            pointPath = points[j];
                            var x = pointPath.getAttribute("x");
                            var y = pointPath.getAttribute("y");
                            // transform the coordinate to display it
                            x = x * zoom + raster.bounds.x;
                            y = y * zoom + raster.bounds.y;
                            currentDrawPath.add(new Point(x, y));
                        }
                        currentDrawPath.data.idXML = textRegions[i].getAttribute("id");
                        currentDrawPath.data.comments = textRegions[i].getAttribute("comments");
                        currentDrawPath.data.shape = "polygon";
                        currentDrawPath.closed = true;
                    }
                }*/

            }
            view.draw();
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

            var pcGts = xmlDoc.getElementsByTagName("PcGts")[0];
            pcGts.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
            pcGts.setAttribute("xsi:schemaLocation", "http://schema.primaresearch.org/PAGE/gts/pagecontent/2013-07-15 http://schema.primaresearch.org/PAGE/gts/pagecontent/2013-07-15/pagecontent.xsd");
            pcGts.setAttribute("pcGtsId", "");

            var d = new Date();
            var created = xmlDoc.getElementsByTagName("Created")[0];
            created.childNodes[0].nodeValue = d;
            var creator = xmlDoc.getElementsByTagName("Creator")[0];
            creator.childNodes[0].nodeValue = myEmail;

            var page = xmlDoc.getElementsByTagName("Page")[0];
            page.setAttribute("imageWidth", imgWidth);
            page.setAttribute("imageHeight", imgHeight);
            page.setAttribute("imageFilename", imgName);
        }


        function editLastChange() {
            var d = new Date();
            var lastChange = xmlDoc.getElementsByTagName("LastChange")[0];
            lastChange.childNodes[0].nodeValue = d;
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

        function searchPath(event) {
            if (currentDrawPath.data.shape == "rectangle" && fromRectangle) {
                var xShow = Math.round(fromRectangle.x * zoom + raster.bounds.x);
                var yShow = Math.round(fromRectangle.y * zoom + raster.bounds.y);
                var searchingRectangle = new Path.Rectangle(new Point(xShow, yShow), event.point);
                searchingRectangle.strokeColor = color;
                searchingRectangle.strokeWidth = 2;
                searchingRectangle.removeOnMove();
            } else if (currentDrawPath.data.shape == "polygon" && currentDrawPathLastPoint) {
                var searchingPath = new Path();
                searchingPath.strokeColor = currentDrawPath.strokeColor;
                searchingPath.strokeWidth = 2;
                var xShow = Math.round(currentDrawPathLastPoint.x * zoom + raster.bounds.x);
                var yShow = Math.round(currentDrawPathLastPoint.y * zoom + raster.bounds.y);
                searchingPath.add(new Point(xShow, yShow));
                searchingPath.add(event.point);
                searchingPath.removeOnMove();
            }
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
        
        // A crucial function to send the image to the server. 
        // imageUrl is a base64 string representing the image. imageUrl is extremely long, so we have to remove the 
        // limit of the ajax POST size. See:
        // http://www.enterprise-architecture.org/documentation/doc-administration/145-post-size-limit
        // http://stackoverflow.com/questions/12194997/unable-to-change-tomcat-users-xml-and-server-xml-while-tomcat7-runs-within
        $(document).ready(function() {                          
            $('#autoSegment').click(function() {
            	document.getElementById("autoSegmentComment").innerHTML = "Please wait for a few seconds!";
            	var imageUrl = document.getElementById("parzival").src;      
                $.post('AutoSegmentServlet', 
                  {
                	imageName:imgName,
                	imageURL:imageUrl
                  },
                  function(responseJson) {    
                	console.log(responseJson);  
                	processResponseJson(responseJson);
                });  
            });
        });
        
        function processResponseJson(responseJson){
        	if (responseJson.textBlocks){
        		drawAutoResult(responseJson.textBlocks, "textBlocks");
        	}
        	if (responseJson.page){
        		drawAutoResult(responseJson.page, "page");
        	}
        	if (responseJson.textLines){
        		drawAutoResult(responseJson.textLines, "textLines");
        	}
        	view.update();
        }
        
        $(document).ready(function() {                          
            $('#loadDatabase').click(function() {
            	document.getElementById("autoSegmentComment").innerHTML = "test one";    
            	$.post('GetImageServlet', 
                        {
                      	imageName:imgName
                        },
                        function(responseJson) {    
                      	console.log(responseJson);  
                      	document.getElementById("parzival").src = responseJson;
                        init();
                      });  
            });
        });

        function drawAutoResult(textRegions, regionType){
      //  	alert("call drawAutoResult");            
        	for (var i = 0; i < textRegions.length; i++){
        		var points = textRegions[i];
                var currentDrawPath = new Path();
                for (var j = 0; j < points.length; j++) {
                    pointPath = points[j];
                    var x = pointPath[0];
                    var y = pointPath[1];
                    // transform the coordinate to display it
                    x = x * zoom + raster.bounds.x;
                    y = y * zoom + raster.bounds.y;
                    currentDrawPath.add(new Point(x, y));
                }
                if (points.length == 4 && points[0][1] == points[1][1] &&
                    points[1][0] == points[2][0] &&
                    points[2][1] == points[3][1])
                    currentDrawPath.data.shape = "rectangle";
                else
                    currentDrawPath.data.shape = "polygon";

                // assign color to different classes
                switch (regionType) {
                case "textBlocks":
                    currentDrawPath.strokeColor = 'blue';
                    break;
                case "page":
                    currentDrawPath.strokeColor = 'red';
                    break;
                case "textLines":
                    currentDrawPath.strokeColor = 'green';
                    document.getElementById("autoSegmentComment").innerHTML = "";
                    break;
                }
                currentDrawPath.strokeWidth = 2;
                currentDrawPath.closed = true;
            //    alert("done!");
        	}
        }
        
        
      
    };
});

/*myApp.config(function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
});*/