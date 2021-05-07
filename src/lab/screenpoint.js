const cv = require('opencvjs-dist/build/opencv');

/**
 * 
 * @param {*} view 手机拍摄的照片
 * @param {*} screen 屏幕截图
 */
function matchTemplate(view, screen) {
    let src = cv.imread(screen);
    let templ = cv.imread(view);
    let dst = new cv.Mat();
    let mask = new cv.Mat();
    cv.matchTemplate(src, templ, dst, cv.TM_CCOEFF, mask);
    let result = cv.minMaxLoc(dst, mask);
    let maxPoint = result.maxLoc;
    let color = new cv.Scalar(255, 0, 0, 255);
    let point = new cv.Point(maxPoint.x + templ.cols, maxPoint.y + templ.rows);
    cv.rectangle(src, maxPoint, point, color, 2, cv.LINE_8, 0);
    let canvas = document.createElement('canvas');
    cv.imshow(canvas, src);
    src.delete(); dst.delete(); mask.delete();
    return canvas
}

function project(view, screen) {
    let dst = new cv.Mat();
    let src1 = cv.imread(screen);
    let src2 = cv.imread(view);
    var orb = new cv.ORB(100);
    var keypoints1 = new cv.KeyPointVector();
    var keypoints2 = new cv.KeyPointVector();
    // find the keypoints with ORB
    orb.detect(src1, keypoints1);
    orb.detect(src2, keypoints2);
    // compute the descriptors with ORB
    var descriptors1 = new cv.Mat();
    var descriptors2 = new cv.Mat();
    orb.compute(src1, keypoints1, descriptors1);
    orb.compute(src2, keypoints2, descriptors2);

    // let dm = new cv.DMatchVectorVector();
    // let matcher = new cv.BFMatcher();
    // matcher.knnMatch(descriptors1, descriptors2, dm, 2);
    // cv.drawMatchesKnn(src1, keypoints1, src2, keypoints2, dm, dst);

    let matches = new cv.DMatchVector();
    let matcher = new cv.BFMatcher();
    matcher.match(descriptors1, descriptors2, matches);
    
    //     matches=temp1;
    var good_matches = new cv.DMatchVector();
    let matchsList=Array.from(new Array(matches.size()),(a,i)=>matches.get(i));
    matchsList=matchsList.sort((a,b)=>a.distance-b.distance);
    for (let i = 0; i < 20; i++) {
        good_matches.push_back(matchsList[i]);
    };

    cv.drawMatches(src1, keypoints1, src2, keypoints2, good_matches, dst);

    // console.log(good_matches)
    let canvas = document.createElement('canvas');
    cv.imshow(canvas, dst);
    src1.delete(); src2.delete(); dst.delete();
    return canvas
}

// const MIN_MATCH_COUNT = 6,
// FLANN_INDEX_KDTREE = 0;

// let sift = cv.xfeatures2d.SIFT_create();

// function project(view, screen, debug=false){
//     // kp_screen, des_screen = sift.detectAndCompute(screen, None)
//     let src = cv.imread(screen);
//     var orb = new cv.ORB(10000);
//     let des = new cv.Mat();
//     let img3 = new cv.Mat();
//     var kp1 = new cv.KeyPointVector();
//     // find the keypoints with ORB
//     orb.detect(src, kp1);
//     // compute the descriptors with ORB
//     var das=new cv.Mat();   
//     orb.compute(src, kp1, das);
// }

// kp_view, des_view = sift.detectAndCompute(view, None)

// index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
// search_params = dict(checks=50)
// flann = cv2.FlannBasedMatcher(index_params, search_params)
// matches = flann.knnMatch(des_screen, des_view, k=2)

// # Store all good matches as per Lowe's ration test
// good = []
// for m, n in matches:
//     if m.distance < 0.7 * n.distance:
//         good.append(m)

// if len(good) < MIN_MATCH_COUNT:
//     logging.debug("ScreenPoint: Not enough matches.")
//     return -1, -1

// screen_pts = np.float32([kp_screen[m.queryIdx].pt
//                          for m in good]).reshape(-1, 1, 2)
// view_pts = np.float32([kp_view[m.trainIdx].pt
//                        for m in good]).reshape(-1, 1, 2)

// h, w = view.shape
// M, mask = cv2.findHomography(view_pts, screen_pts, cv2.RANSAC, 5.0)

// pts = np.float32([[(w - 1) * 0.5, (h - 1) * 0.5]]).reshape(-1, 1, 2)
// dst = cv2.perspectiveTransform(pts, M)
// x, y = np.int32(dst[0][0])

// if debug:
//     img_debug = draw_debug_(x, y, view, screen, M, mask, kp_screen,
//                             kp_view, good)
//     return x, y, img_debug
// else:
//     return x, y


// function draw_debug_(x, y, view, screen, M, mask, kp_screen, kp_view, good):

//     matchesMask = mask.ravel().tolist()
//     draw_params = dict(
//         matchColor=(0, 255, 0),  # draw matches in green color
//         singlePointColor=None,
//         matchesMask=matchesMask,  # draw only inliers
//         flags=2)
//     img_debug = cv2.drawMatches(screen, kp_screen, view, kp_view, good, None,
//                                 **draw_params)

//     # Get view centroid coordinates in img_debug space.
//     cx = int(view.shape[1] * 0.5 + screen.shape[1])
//     cy = int(view.shape[0] * 0.5)
//     # Draw view outline.
//     cv2.rectangle(img_debug, (screen.shape[1], 0),
//                   (img_debug.shape[1] - 2, img_debug.shape[0] - 2),
//                   (0, 0, 255), 2)
//     # draw connecting line.
//     cv2.polylines(img_debug, [np.int32([(x, y), (cx, cy)])], True,
//                   (100, 100, 255), 1, cv2.LINE_AA)
//     # Draw query/match markers.
//     cv2.drawMarker(img_debug, (cx, cy), (0, 0, 255), cv2.MARKER_CROSS, 30, 2)
//     cv2.circle(img_debug, (x, y), 10, (0, 0, 255), -1)

//     return img_debug



//Template Match Example
// let src = cv.imread('imageCanvasInput');
// let templ = cv.imread('templateCanvasInput');
// let dst = new cv.Mat();
// let mask = new cv.Mat();
// cv.matchTemplate(src, templ, dst, cv.TM_CCOEFF, mask);
// let result = cv.minMaxLoc(dst, mask);
// let maxPoint = result.maxLoc;
// let color = new cv.Scalar(255, 0, 0, 255);
// let point = new cv.Point(maxPoint.x + templ.cols, maxPoint.y + templ.rows);
// cv.rectangle(src, maxPoint, point, color, 2, cv.LINE_8, 0);
// cv.imshow('canvasOutput', src);
// src.delete(); dst.delete(); mask.delete();


module.exports = {
    project,
    matchTemplate
};