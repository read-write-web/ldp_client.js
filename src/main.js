(function() {
    require.config({
        shim: {

        },
        paths: {
            ldp_client: './ldp_client'
        }
    });

    /**
     * This code is just for quick testing the server.
     */
    require(["ldp_client", "async"], function(LDPClient, async) {
       // entry point
    });

}).call(this);
