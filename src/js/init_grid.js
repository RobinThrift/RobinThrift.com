;(function($) {

    "use strict";

    $(function() {

        var $hg = $("#home_grid");

        do_grid();


        function do_grid() {
            //if ($hg.width() < 620) {
                $hg.imagesLoaded(function() {

                $hg.masonry({
                        columnWidth: function(cw) {return parseInt(0.4680851063829787 * cw);},
                        itemSelector: ".post",
                        gutterWidth: 16,
                        isFitWidth: false,
                        isResizable: true,
                        isResizeBound: true
                    }); 
                });
            //}
        }

    });

})(jQuery);