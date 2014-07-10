/**
 * Created by antonio on 10/07/2014.
 */
(function() {

    /**
     * This module include utility functions that implement high level RDF operations.
     * It uses RDFStore.js as the underlying RDF library.
     * The idea is to abstract the underlying implementation from the rest of the library so
     * it can be swapped if necessary by a different library.
     */
    define("ldp_client/rdf", ["rdf_store"], function(RDFStore){
        var RDF = {};

        /**
         * Auxiliar function used to build a new store graph from a given turtle document.
         *
         * @param baseURI base URI that will be used to resolve relative URIs
         * @param turtlePayload RDF data in a Turtle serialization.
         * @param cb Callback function
         */
        RDF.makeGraph = function(baseURI, turtlePayload, cb) {
            RDFStore.create(function(store) {
                // Register usual namespaces
                store.registerDefaultProfileNamespaces();
                // Register LDP namespace
                store.registerDefaultNamespace("ldp", "http://www.w3.org/ns/ldp#");

                turtlePayload = turtlePayload.replace(/<>/g, "<" + baseURI + ">");
                if (baseURI[baseURI.length - 1] !== "#" && baseURI[baseURI.length - 1 ] !== "/") {
                    baseURI = baseURI + "/";
                }
                store.load('text/n3', turtlePayload, {baseURI: baseURI}, function (success) {
                    if (success) {
                        cb(false, store);
                    } else {
                        cb(true, "Error loading turtle document into graph");
                    }
                })
            });
        };

        /**
         * Exports the provided RDF graph as a turtle serialized RDF file
         *
         * @param graph
         * @param cb
         */
        RDF.exportGraph = function(graph, cb) {
            graph.execute("CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }", function(success, graph){
                if(success) {
                    cb(false, grapht.toNT());
                } else {
                    cb(true, graph);
                }
            });
        };

        /**
         * Inserts a turtle serialized document into the RDF provided graph.
         *
         * @param graph
         * @param turtlePayload
         * @param cb
         */
        RDF.insertIntoGraph = function(graph, turtlePayload, cb) {
            graph.execute("INSERT DATA { "+turtlePayload+" }", function(success, msg){
                cb(!success,msg);
            });
        };

        /**
         * Removes the triples in the provided turtle document from the provided RDF graph.
         *
         * @param graph
         * @param turtlePayload
         * @param cb
         */
        RDF.removeFromGraph = function(graph, turtlePayload, cb) {
            graph.execute("DELETE DATA { "+turtlePayload+" }", function(success, msg){
                cb(!success,msg);
            });
        };

        return RDF;
    });
}).call(this);