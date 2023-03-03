/*
 * File: Utilities
 * Description: Helpers, Tools
 * Author: Raby Yuson
 * Author URI: http://www.rabyyuson.com/
 * Copyright Raby Yuson.
 */

function imgResizer(maxSize,image){
    var max_size = maxSize;
    var img = image;
    if (img.height() > img.width()) {
        var h = max_size;
        var w = Math.ceil(img.width() / img.height() * max_size);
    } else {
        var w = max_size;
        var h = Math.ceil(img.height() / img.width() * max_size);
    }
        img.css({ height: h, width: w });
}
