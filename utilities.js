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




// distance between a point and a line
function pointLineDistance(point1, point2, cursor, widthCanvas) {
    var p1x = point1.x;
    var p1y = widthCanvas - point1.y;
    var p2x = point2.x;
    var p2y = widthCanvas - point2.y;
    var cx = cursor.x;
    var cy = widthCanvas - cursor.y;

    // compute the perpendicular distance 
    var a = (p2y - p1y) / (p2x - p1x); // slope
    var c = a * p1x * (-1) + p1y;
    var b = -1;
    var distance = Math.abs(a * cx + b * cy + c) / Math.sqrt(a * a + b * b);

    // computer the perpendicular intersection
    var pa = 1 / a * (-1); // perpendicular slope (a)
    var x = ((-1) * pa * cx - p1y + a * p1x + cy) / (a - pa);
    var y = a * (x - p1x) + p1y;
    y = widthCanvas - y;

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