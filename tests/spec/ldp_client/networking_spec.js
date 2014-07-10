/**
 * Created by antonio on 08/07/2014.
 */

define(["ldp_client/networking", "async", "underscore"], function(Networking, async, _) {

    describe("ldp_client/networking", function(){


        describe("LDPResource", function(){

            it("should be able to retrieve meta-data for a remote resource", function (done) {
                Networking.LDPResource.metadata("/", function(err, metadata){
                    expect(err).toEqual(false);
                    expect(metadata.type).toEqual("http://www.w3.org/ns/ldp#BasicContainer");
                    done();
                });
            });

            it("should be possible to retrieve and query a remote resource", function(done){
                var container;
                async.series([
                        // Get the LDP container resource
                        function (cb) {
                            container = new Networking.LDPResource("/");
                            container.get(function (err, cont) {
                                expect(err).toEqual(false);
                                expect(container.url).toEqual("/");
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
                                expect(err).toEqual(false);
                                expect(container.graph).not.toBeNull();
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
                                expect(err).toEqual(false);
                                expect(triples.length).toBeGreaterThan(0);
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
                                expect(err).toEqual(false);
                                expect(results.length).toBeGreaterThan(0);
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
                        }
                    ],
                    function(err){
                        expect(err).toBeFalsy();
                        done();
                    })
            });

            it("should be possible to create and modify resources in a container", function(done){
                var container,fooResource;
                async.series([
                    // Get the LDP container resource
                    function (cb) {
                        container = new Networking.LDPResource("/");
                        container.get(function (err, cont) {
                            expect(err).toEqual(false);
                            expect(container.url).toEqual("/");
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
                    // POST a new LDP resource into the container
                    function (cb) {
                        fooResource = new Networking.LDPResource();
                        fooResource.representation = "<> a <http://xmlns.com/foaf/0.1/Person>; <http://xmlns.com/foaf/0.1/name> \"foo\" .";

                        fooResource.post(container.url, function (err) {
                            expect(err).toBeFalsy();
                            expect(fooResource.url).not.toBeNull();
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
                        fooResource.representation = "<> a <http://xmlns.com/foaf/0.1/Person>; <http://xmlns.com/foaf/0.1/name> \"foo2\" .";
                        fooResource.put(function (err) {
                            expect(err).toBeFalsy();
                            expect(fooResource.representation).not.toBeNull();

                            if (err) {
                                console.log("===================================================");
                                console.log("** ERROR PUT resource: ");
                                console.log(err);
                                cb(err);
                            } else {
                                console.log("===================================================");
                                console.log("** SUCCESS PUT resource: ");
                                console.log(fooResource.representation);
                                fooResource.rel("http://xmlns.com/foaf/0.1/name", function(err,res){
                                    expect(res.length).toEqual(1);
                                    expect(res[0]).toEqual('foo2');
                                    cb();
                                })
                            }
                        });
                    },


                    // Get the resource again
                    function (cb) {
                        fooResource.get(function (err, res) {
                            expect(err).toBeFalsy();
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

                    // Rebuild the RDF representation of the resource
                    function(cb) {
                        var oldRepresentation = fooResource.representation;
                        fooResource.construct(function(err, res){
                            debugger;
                            cb();
                        });
                    },

                    // Delete the resource
                    function (cb) {
                        fooResourceURL = fooResource.url;
                        fooResource.delete(function (err) {
                            expect(err).toBeFalsy();
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
                        fooResource = new Networking.LDPResource(fooResourceURL);
                        fooResource.get(function (err, res) {
                            fooResource = res;
                            expect(err).toEqual(true);
                            expect(res).toEqual(404);
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
                    }
                ], function(err){
                    expect(err).toBeFalsy();
                    done();
                });
            });

            it("should be possible to discover remote resources with the right type", function(done){

                async.series([
                    // Discovering remote LDP resources
                    function(cb) {
                        var operations = [];

                        operations.push(function(cb){
                            Networking.LDPResource.discover("/",function(err, resource){
                                if(err) {
                                    cb(true,null);
                                } else {
                                    cb(null,resource);
                                }
                            })
                        });

                        operations.push(function(cb){
                            Networking.LDPResource.discover("/card",function(err, resource){
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
                                _.each(results, function(result){
                                    if(result.url === "/") {
                                        expect(result.constructor.name).toEqual("LDPBasicContainer");
                                    } else if(result.url === "/card") {
                                        expect(result.constructor.name).toEqual("LDPResource");
                                    } else {
                                        expect(true).toBeFalsy();
                                    }
                                });
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
                ], function(err){
                    expect(err).toBeFalsy();
                    done();
                })
            });
        });

        describe("LDPBasicContainer", function(){

            it("should be possible to list the contents of a remote container", function(done){

                // Retrieve the contents of a container
                Networking.LDPResource.discover("/", function(err, container){
                    container.contents(function(err, contents){
                        if(err) {
                            console.log("===================================================");
                            console.log("** ERROR retrieving container contents: ");
                            cb(err);
                        } else {
                            console.log("===================================================");
                            console.log("** SUCCESS retrieving container contents: ");
                        }

                        expect(err).toBeFalsy();
                        expect(contents.length).toBeGreaterThan(0);
                        _.each(contents,function(resource){
                            expect(resource.url).not.toBeNull();
                        });
                        done();
                    });
                });
            });

        });

    }); // end of describe("ldp_client/networking)

}); // end of define