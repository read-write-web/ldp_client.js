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

        return RDF;
    });
}).call(this);