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
    require(["ldp_client"], function(LDPClient) {
        var container = new LDPClient.LDPResource("/");
        container.get(function(err, container){
            if(err){
                console.log("===================================================");
                console.log("** ERROR: ");
                console.log(err);
            } else {
                console.log("===================================================");
                console.log("** success: ");
                console.log(container.url);

                var foo = new LDPClient.LDPResource();
                foo.representation = "<> a <foaf:Person>; <foaf:name> \"foo\" .";

                foo.post(container.url, function(err, foo){
                    if(err) {
                        console.log("===================================================");
                        console.log("** ERROR: ");
                        console.log(err);
                    } else {
                        console.log("===================================================");
                        console.log("** success: ");
                        console.log(foo.url);

                        foo.representation = "<> a <foaf:Person>; <foaf:name> \"foo2\" .";

                        foo.put(function(err, foo){
                            if(err) {
                                console.log("===================================================");
                                console.log("** ERROR: ");
                                console.log(err);
                            } else {
                                console.log("===================================================");
                                console.log("** success: ");
                                console.log(foo.representation);
                            }

                            foo.delete(function(){
                                if(err) {
                                    console.log("===================================================");
                                    console.log("** ERROR: ");
                                    console.log(err);
                                } else {
                                    console.log("===================================================");
                                    console.log("** success: ");
                                    console.log(foo.url);
                                }
                            })
                        });
                    }
                });
            }
        });

    });

}).call(this);
