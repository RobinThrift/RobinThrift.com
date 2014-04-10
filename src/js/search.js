;(function($) {

    "use strict";

    $(function() {
        var $sr  = $(".search_results"),
            $st  = $("#searchterm"),
            _pos = $st.offset();

        $sr.css({
            top: _pos.top,
            left: _pos.left
        });

        // search
        $st.on("keyup", function() {

            if (this.value.length >= 4) {

                $.ajax({
                    url: "http://webbrickworks.com:5345",
                    data: { q: this.value },
                    type: "GET",
                    dataType: "json",
                    success: function(res) {
                        console.log(res);

                        var _html = "";

                        $.each(res.hits, function(_i, hit) {
                            var title = hit.title;

                            if (title.length >= 25) {
                                title = title.substr(0,22) + "...";
                            }

                            _html += '<li><span class="grey">&lt; <a href="' + hit.url + '">' + title + '</a> &gt;</span></li>';
                        });

                        if (!res.total) {
                            _html += '<li><span class="grey">&lt; Nothing found... &gt;</span></li>';
                        }

                        $sr.find("ul").empty().html(_html);

                        $sr.show();
                    }
                });

            }

        });

        $st.on("blur", function() {
            setTimeout(function() {
                $sr.hide();  
            }, 3000);
            
        });

        $st.on("focus", function() {
            if ($sr.find("li").length) {
                $sr.show();
            }
        });

        $("#searchform").on("submit", function(e) {
            e.preventDefault();
            return false;
        });
    });

})(jQuery);