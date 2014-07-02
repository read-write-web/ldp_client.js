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
        var container = null;
        var fooResource = null;
        var fooResourceURL = null;

        async.series([

            // Discover information about the LDP container resource
            function(cb){
                LDPClient.LDPResource.metadata("/", function(err, metadata){
                    if (err) {
                        console.log("===================================================");
                        console.log("** ERROR DISCOVERING container: ");
                        console.log(err);
                        cb(err);
                    } else {
                        console.log("===================================================");
                        console.log("** SUCCESS DISCOVERING container: ");
                        console.log(metadata);
                        cb();
                    }
                });
            },

            // Get the LDP container resource
            function (cb) {
                container = new LDPClient.LDPResource("/");
                container.get(function (err, cont) {
                    if (err) {
                        console.log("===================================================");
                        console.log("** ERROR GET container: ");
                        console.log(err);
                        cb(err);
                    } else {
                        container = cont;
                        console.log("===================================================");
                        console.log("** SUCCESS GET container: ");
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
                        console.log("** SUCCESS PARSE container RDF: ");
                        console.log(container.graph != null);
                        cb();
                    }
                });
            },

            // Run a SPARQL query over the resource
            function(cb) {
                container.query("SELECT ?s ?o WHERE { ?s a ?o }", function(err, triples) {
                    if(err) {
                        console.log("===================================================");
                        console.log("** ERROR SPARQL querying the container: ");
                        console.log(triples);
                        cb(true);
                    } else {
                        console.log("===================================================");
                        console.log("** SUCCESS SPARQL querying the container: ");
                        for(var i=0; i< triples.length; i++)
                            console.log("<"+triples[i].s.value+"> a <"+triples[i].o.value+">");
                        cb();
                    }
                });
            },

            // Retrieves a property from the resource
            function(cb) {
                container.rel("ldp:contains", function(err, results){
                    if(err) {
                        console.log("===================================================");
                        console.log("** ERROR finding RDF values with rel: ");
                        console.log(triples);
                        cb(true);
                    } else {
                        console.log("===================================================");
                        console.log("** SUCCESS finding RDF values with rel: ");
                        for(var i=0; i< results.length; i++)
                            console.log(results[i]);
                        cb();
                    }
                })
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
                        console.log("** SUCCESS POST resource: ");
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
                        console.log("** SUCCESS PUT resource: ");
                        console.log(fooResource.representation);
                        cb();
                    }
                });
            },


            // Get the resource again
            function (cb) {
                fooResource.get(function (err, res) {
                    fooResource = res;
                    if (err) {
                        console.log("===================================================");
                        console.log("** ERROR GET resource again: ");
                        console.log(err);
                        cb(err);
                    } else {
                        console.log("===================================================");
                        console.log("** SUCCESS GET resource again: ");
                        console.log(fooResource.representation);
                        cb();
                    }
                });
            },

            // Delete the resource
            function (cb) {
                fooResourceURL = fooResource.url;
                fooResource.delete(function (err) {
                    if (err) {
                        console.log("===================================================");
                        console.log("** ERROR DELETE resource: ");
                        console.log(err);
                        cb(err);
                    } else {
                        console.log("===================================================");
                        console.log("** SUCCESS DELETE resource: ");
                        console.log(fooResource.url);
                        cb();
                    }

                });
            },

            // The resource should not be available anymore
            function (cb) {
                fooResource = new LDPClient.LDPResource(fooResourceURL);
                fooResource.get(function (err, res) {
                    fooResource = res;
                    if (err) {
                        console.log("===================================================");
                        console.log("** SUCCESS GET removed resource failed with code: ");
                        console.log(res);
                        cb();
                    } else {
                        console.log("===================================================");
                        console.log("** ERROR GET removed resource succeeded: ");
                        console.log(fooResource.representation);
                        cb(true);
                    }
                });
            },

            // Discovering remote LDP resources
            function(cb) {
                var operations = [];

                operations.push(function(cb){
                    LDPClient.LDPResource.discover("/",function(err, resource){
                        if(err) {
                            cb(true,null);
                        } else {
                            cb(null,resource);
                        }
                    })
                });

                operations.push(function(cb){
                    LDPClient.LDPResource.discover("/card",function(err, resource){
                        if(err) {
                            cb(true,null);
                        } else {
                            cb(null,resource);
                        }
                    });
                });

                async.parallel(
                    operations,
                    function(err, results){
                        if (err) {
                            console.log("===================================================");
                            console.log("** ERROR discovering resources: ");
                            console.log(res);
                            cb(err);
                        } else {
                            console.log("===================================================");
                            console.log("** SUCCESS discovering resources: ");
                            console.log(results[0].url +" => "+ results[0].constructor.name);
                            console.log(results[1].url +" => "+results[1].constructor.name);
                            cb();
                        }
                    }
                );
            }


        ]);
    });

}).call(this);
