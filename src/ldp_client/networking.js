/**
 * Created by antonio on 30/06/2014.
 */
(function() {

    /**
     * This module includes all the required logic for fetching LDP resources from a LDP server.
     * The current implementation uses jQuery as the provider of the underlying AJAX logic.
     */
    define("ldp_client/networking", ["jquery", "rdf_store", "async", "underscore"], function($, RDFStore, async, _) {
        var Networking = {};

        /**
         * Auxiliar function used to build a new store graph from a given turtle document.
         *
         * @param baseURI base URI that will be used to resolve relative URIs
         * @param turtlePayload RDF data in a Turtle serialization.
         * @param cb Callback function
         */
        var makeGraph = function(baseURI, turtlePayload,cb) {
            RDFStore.create(function(store){
                // Register usual namespaces
                store.registerDefaultProfileNamespaces();
                // Register LDP namespace
                store.registerDefaultNamespace("ldp","http://www.w3.org/ns/ldp#");

                store.load('text/n3',turtlePayload, {baseURI: baseURI}, function(success){
                    if(success) {
                        cb(false,store);
                    } else {
                        cb(true,"Error loading turtle document into graph");
                    }
                })
            });
        };

        /**
         * Base class for all resources.
         * A RESTful resource is defined by a triple:
         *  - URL
         *  - Representation
         *  - MediaType
         * All these values can be set using the constructor function of the object.
         * The object interface implements the basic logic to retrieve a RESTful resource.
         *
         * @param options url, representation and mediaType
         * @constructor
         */
        function RESTResource(options) {
            options = (options || {});
            this.url = options.url;
            this.representation = options.representation;
            this.mediaType = options.mediaType;
        }
        Networking.RESTResource = RESTResource;
        Networking.RESTResource.prototype.constructor = RESTResource;

        /**
         * Gets the resource representation for the provided resource URL and media type.
         *
         * @param cb callback function
         */
        Networking.RESTResource.prototype.get = function(cb) {
            var that = this;
            if(that.url == null || that.mediaType == null){
                throw "Cannot send a GET request to a remote resource without URL and media type";
            } else {
                $.ajax(that.url, {
                    "headers": {
                        "Accept": that.mediaType
                    }
                }).done(function(res){
                    that.representation = res;
                    cb(false,that);

                }).fail(function(err){
                    cb(true, err.status, err);
                });
            }
        };


        /**
         * Updates the representation of the remote resource using the local representation and media type.
         *
         * @param cb callback function
         */
        Networking.RESTResource.prototype.put = function(cb) {
            var that = this;
            if(this.url == null || this.representation == null || this.mediaType == null) {
                throw "Cannot send a PUT request to a remote resource without URL, representation and media type";
            } else {
                $.ajax(that.url, {
                    type: "PUT",
                    data: that.representation,
                    contentType: that.mediaType
                }).done(function(){
                    cb(false,that);
                }).fail(function(err){
                    cb(true, err.status, err);
                });
            }
        };

        /**
         * Tries to persist the current representation of the resource in a remote container resource.
         * The remote service should provide the URL of the newly created resource using the 'Location' header.
         *
         * @param containerURL
         * @param cb callback function
         */
        Networking.RESTResource.prototype.post = function(containerURL, cb) {
            var that = this;
            if(that.representation == null || that.mediaType == null || containerURL == null) {
                throw "Cannot send a POST request to a remote resource without the container URL, representation and media type";
            } else {
                $.ajax(containerURL, {
                    type: "POST",
                    data: that.representation,
                    contentType: that.mediaType
                }).done(function(status, success, xhr){
                    var location = xhr.getResponseHeader("Location");
                    if(location == null) {
                        cb(true, "Cannot find URL for the created resource")
                    } else {
                        that.url = location;
                        cb(false,that);
                    }
                }).fail(function(err){
                    cb(true, err.status, err);
                });
            }

        };

        /**
         * Destroys the resource in the remote service.
         * If it is successful the resource URL is set to null.
         *
         * @param cb callback function
         */
        Networking.RESTResource.prototype.delete = function(cb) {
            var that = this;
            if(that.url == null) {
                throw "Cannot send a DELETE request to a remote resource without URL";
            } else {
                $.ajax(that.url, {
                    type: "DELETE"
                }).done(function(){
                    that.url = null;
                    cb(false,that);
                }).fail(function(err){
                    cb(true, err.status, err);
                });
            }
        };

        /**
         * Model for a LDP resource.
         * It is designed as a RESTful resource using turtle as the representation format.
         *
         * @param url Location of the LDP resource
         * @constructor
         */
         function LDPResource(url) {
            var options = {
                mediaType: 'text/turtle'
            };

            if(url != null) options.url = url;

            Networking.RESTResource.call(this,options);

            // When the representation is parsed, the resulting grpah will be stored in
            // this property
            this.graph = null;
            // A dictionary where we will store results for rel queries.
            // It must be cleaned every single time the graph is parsed
            this.queryCache = {};
            // The metadata about the LDP resource will be stored here
            this.meta = null;
        }
        Networking.LDPResource = LDPResource;
        Networking.LDPResource.prototype = new Networking.RESTResource();
        Networking.LDPResource.prototype.constructor = LDPResource;

        /**
         * Parses the triples in the resource representation building an associated RDF graph
         * that can be queried.
         *
         * @param cb
         */
        Networking.LDPResource.prototype.parse = function(cb) {
            var that = this;
            makeGraph(this.url, this.representation, function(err, store){
                if(err) {
                    cb(true, "Error parsing RDF representation for LDP resource")
                } else {
                    that.queryCache = {}; // Clean the cache
                    that.graph = store;
                    cb(false,that)
                }
            });
        };

        /**
         * A function that will run a SPARQL query over the retrieved resource.
         * If the resource representation hasn't been parsed yet, it will be automatically parsed.
         * The results will be returned using the low level interface provided by RDFStore.js
         *
         * @param sparql SPARQL query to run
         * @param cb
         */
        Networking.LDPResource.prototype.query = function(sparql, cb){
            var that = this;
            var operations = [], buildGraphOperation, queryGraphOperation, result, error;

            // If the graph is not ready, we first need to parse the representation
            if(this.graph == null) {
                buildGraphOperation = function(cb){
                    that.parse(function(err,res){
                        if(err) {
                            error = res;
                            cb(err);
                        } else {
                            cb();
                        }
                    })
                };
                operations.push(buildGraphOperation);
            }

            // Now we can run the query over the parsed graph
            queryGraphOperation = function(cb) {
                that.graph.execute(sparql, function(success, triples){
                    if(success) {
                        result = triples;
                        cb();
                    } else {
                        error = triples;
                        cb(true)
                    }
                });
            };
            operations.push(queryGraphOperation);

            async.series(operations, function(){
                if(result != null) {
                    cb(false, result);
                } else {
                    cb(true, error);
                }
            });
        };


        /**
         * Retrieves the values related to the container URL in the resource RDF graph by a RDF property.
         *
         * @param property RDF property of the relation to search.
         * @param cb
         */
        Networking.LDPResource.prototype.rel = function(property, cb){
            var that = this, queryProperty, operations = [];
            if(this.queryCache[property] != null) {
                cb(false, this.queryCache[property]);
            } else  {
                if(this.graph == null) {
                    operations.push(function(cb){
                        that.parse(function(err){
                            if(err) {
                                cb(err);
                            } else {
                                cb()
                            }
                        })
                    })
                }
                operations.push(function(cb){
                    if(that.graph.rdf.resolve(property) != null) {
                        queryProperty = property
                    } else {
                        queryProperty = "<"+property+">";
                    }
                    that.query("SELECT ?o  WHERE { <"+that.url+"> "+queryProperty+" ?o }", function(err, results){

                        if(err) {
                            cb(err);
                        } else {
                            results = _.map(results, function(triples){ return triples.o.value; });
                            // save in cache
                            that.queryCache[property] = results;
                            cb(null,results);
                        }
                    });
                });

                async.series(
                    operations,
                    function(err, results) {
                        if(err) {
                            cb(true, err);
                        } else {
                            cb(false, results.pop());
                        }
                    }
                )
            }
        };

        /**
         * Fetches the meta-data about this resource.
         *
         * @param cb
         */
        Networking.LDPResource.prototype.metadata = function(cb) {
            var that = this;
            if(this.meta != null){
                cb(false, this.meta);
            } else {
                if(this.url == null) {
                    throw "Cannot fetch meta-data for a LDP resource without URL";
                } else {
                    LDPResource.metadata(this.url, function(err,metadata){
                        if(err) {
                            cb(true, metadata);
                        } else {
                            that.meta = metadata;
                            cb(false, metadata);
                        }
                    })
                }
            }
        };

        /**
         * Model for a LDP Basic Container
         * It is a subtype of the LDPResource object with additional logic to list its contained resources.
         * object.
         *
         * @param url Location of the LDP resource
         * @constructor
         */
        function LDPBasicContainer(url) {
            Networking.LDPResource.call(this,url);
        }
        Networking.LDPBasicContainer = LDPBasicContainer;
        Networking.LDPBasicContainer.prototype = new Networking.LDPResource();
        Networking.LDPBasicContainer.prototype.constructor = LDPBasicContainer;


        /**
         * Function that retrieves all the contained resources in this container.
         *
         * @param cb
         */
        Networking.LDPBasicContainer.prototype.contents = function(cb){
            var that = this;
            if(this.queryCache["__contents__"] != null) {
                cb(false, this.queryCache["__contents__"]);
            } else {
                this.rel("ldp:contains", function(err, resources){
                    var operations = _.map(resources, function(resource){
                        return function(cb){
                            Networking.LDPResource.discover(resource, function(err, res){
                                if(err) {
                                    cb(true, err);
                                } else {
                                    cb(null, res);
                                }
                            });
                        }
                    });
                    async.parallel(
                        operations,
                        function(err, results) {
                            if(err) {
                                cb(true, err);
                            } else {
                                that.queryCache["__contents__"] = results;
                                cb(false, results);
                            }
                        }
                    );
                });
            }
        };

        /**
         * This function returns meta information about a potential LDP Resource
         *
         * @param url
         * @param cb
         */
        Networking.LDPResource.metadata = function(url,cb){
            $.ajax(url,{
                type: "HEAD"
            }).done(function(_res, _success, xhr){
                // Let's parse the Link header.
                // Sample value: '<.acl>; rel=acl, <http://www.w3.org/ns/ldp#BasicContainer>; rel=type'
                var header = xhr.getResponseHeader("Link"), metadata = {}, components;
                if(header != null) {
                    components = header.split(/,\s+/g);
                    metadata = _.reduce(components, function(metadata, component) {
                            var parts = component.split(/;\s+/);
                            var urlPart = parts[0];
                            var relPart = parts[1];

                            urlPart = urlPart.replace(/^</,"").replace(/>$/,"");
                            if(urlPart.indexOf("://") === -1) {
                                urlPart = url + urlPart;
                            }

                            if(relPart.indexOf("rel=") !== -1){
                                relPart = relPart.replace("rel=","");
                            }

                            metadata[relPart] = urlPart;
                            return metadata;
                        },
                        metadata);

                }
                // Let's parse the Allow header
                // Sample value: 'Allow:OPTIONS, GET, HEAD, PUT, PATCH, DELETE, POST'
                header = xhr.getResponseHeader("Allow");
                if(header != null) {
                    metadata["allow"] = header.split(/,\s+/)
                }

                cb(false,metadata);
            }).fail(function(err){
                cb(true,err);
            });
        };

        /**
         * This function parses the right type of RESTful resource for the provided URL, using the
         * resource meta-data.
         * The resulting resource object can be a RESTful resource, a LDP resource or a LDP container.
         *
         * @param url
         * @param cb
         */
        Networking.LDPResource.discover = function(url, cb){
            Networking.LDPResource.metadata(url, function(err, metadata){
                var resource;
                if(err) {
                    cb(err, metadata);
                } else {
                    // Match the type of resource found and build the right object for it
                    if(metadata['type'] == null) {
                        resource = new Networking.RESTResource({url: url});
                    } else if(metadata['type'] == "http://www.w3.org/ns/ldp#BasicContainer") {
                        resource = new Networking.LDPBasicContainer(url);
                        resource.meta = metadata;
                    } else {
                        resource = new Networking.LDPResource(url);
                        resource.meta = metadata;
                    }

                    resource.get(cb)
                }
            });
        };

        return Networking;
    });

}).call(this);