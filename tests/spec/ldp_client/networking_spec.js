/**
 * Created by antonio on 08/07/2014.
 */

describe("ldp::networking", function(){

    describe("LDPResource", function(){

        define(["ldp_client/networking", "async"], function(Networking, async) {

            it("should be able to discover a remote resource", function (done) {
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
        });

    });

});