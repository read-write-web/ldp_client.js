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
        Networking.RESTResource = function(options) {
            options = (options || {});
            this.url = options.url;
            this.representation = options.representation;
            this.mediaType = options.mediaType;
        };
        Networking.RESTResource.prototype.constructor = Networking.RESTResource;

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
        Networking.LDPResource =  function(url) {
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
            this.queryCache = {}
        };
        Networking.LDPResource.prototype = new Networking.RESTResource();
        Networking.LDPResource.prototype.constructor = Networking.LDPResource;

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

            // Now we can run query over the parsed graph
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
            if(this.queryCache[property] != null) {
                cb(false, this.queryCache[property]);
            } else  {
                this.query("SELECT ?o  WHERE { <"+this.url+"> <"+property+"> ?o }", function(err, results){
                    if(err) {
                        cb(err, results);
                    } else {
                        results = _.map(results, function(triples){
                            return triples.o.value;
                        });

                        cb(false, results);
                    }
                });
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
        Networking.LDPBasicContainer =  function(url) {
            Networking.LDPResource.call(this,url);
            this.contents = null;
        };
        Networking.LDPBasicContainer.prototype = new Networking.LDPResource();
        Networking.LDPBasicContainer.prototype.constructor = Networking.LDPBasicContainer;



        return Networking;
    });

}).call(this);