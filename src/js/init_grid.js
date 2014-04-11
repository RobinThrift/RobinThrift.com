//= require js/imagesloaded.js
//= require js/masonry.js

;(function() {

    "use strict";

    var container = document.querySelector('#home_grid');

    imagesLoaded(container, function() {
        new Masonry(container, {
            columnWidth: '.post',
            itemSelector: '.post',
            gutter: 16,
            isFitWidth: false,
            isResizable: true,
            isResizeBound: true
        });
    });

})();