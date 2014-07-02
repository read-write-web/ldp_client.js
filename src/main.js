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
        var container = new LDPClient.LDPResource("/");
        var fooResource = null;

        async.series([

            // Get the LDP container resource
            function (cb) {
                container.get(function (err, cont) {
                    if (err) {
                        console.log("===================================================");
                        console.log("** ERROR GET container: ");
                        console.log(err);
                        cb(err);
                    } else {
                        container = cont;
                        console.log("===================================================");
                        console.log("** success GET container: ");
                        console.log(container.url);
                        cb();
                    }
                });
            },

            // Parse the RDF representation of the resource
            function(cb) {
                container.parse(function(err){
                    if (err) {
                        console.log("===================================================");
                        console.log("** ERROR PARSE container RDF: ");
                        console.log(err);
                        cb(err);
                    } else {
                        console.log("===================================================");
                        console.log("** success PARSE container RDF: ");
                        console.log(container.graph);
                        cb();
                    }
                });
            },

            // Run a SPARQL query over the resource
            function(cb) {
                container.graph.execute("SELECT ?s ?o WHERE { ?s a ?o }", function(success, triples) {
                    if(!success) {
                        console.log("===================================================");
                        console.log("** ERROR SPARQL querying the container: ");
                        console.log(triples);
                        cb(false);
                    } else {
                        console.log("===================================================");
                        console.log("** success SPARQL querying the container: ");
                        for(var i=0; i< triples.length; i++)
                            console.log("<"+triples[i].s.value+"> a <"+triples[i].o.value+">");
                        cb();
                    }
                });
            },

            // POST a new LDP resource into the container
            function (cb) {
                fooResource = new LDPClient.LDPResource();
                fooResource.representation = "<> a <foaf:Person>; <foaf:name> \"foo\" .";

                fooResource.post(container.url, function (err) {
                    if (err) {
                        console.log("===================================================");
                        console.log("** ERROR POST resource: ");
                        console.log(err);
                        cb(err);
                    } else {
                        console.log("===================================================");
                        console.log("** success POST resource: ");
                        console.log(fooResource.url);
                        cb();
                    }
                });
            },

            // Modify the LDP resource just created
            function (cb) {
                fooResource.representation = "<> a <foaf:Person>; <foaf:name> \"foo2\" .";
                fooResource.put(function (err) {
                    if (err) {
                        console.log("===================================================");
                        console.log("** ERROR PUT resource: ");
                        console.log(err);
                        cb(err);
                    } else {
                        console.log("===================================================");
                        console.log("** success PUT resource: ");
                        console.log(fooResource.representation);
                        cb();
                    }
                });
            },

            // Delete the resource
            function (cb) {
                fooResource.delete(function (err) {
                    if (err) {
                        console.log("===================================================");
                        console.log("** ERROR DELETE resource: ");
                        console.log(err);
                        cb(err);
                    } else {
                        console.log("===================================================");
                        console.log("** success DELETE resource: ");
                        console.log(fooResource.url);
                        cb();
                    }

                });
            }

        ]);
    });

}).call(this);
