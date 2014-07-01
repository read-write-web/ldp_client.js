/**
 * Created by antonio on 30/06/2014.
 */
(function() {

    /**
     * This module includes all the required logic for fetching LDP resources from a LDP server.
     * The current implementation uses jQuery as the provider of the underlying AJAX logic.
     */
    define("ldp_client/networking", ["jquery"], function($) {
        var Networking = {};

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
                    cb(true, err)
                });
            }
        };


        /**
         * Updates the representation of the remote resource using the local representation and media type.
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
                    cb(true, err)
                });
            }
        };

        /**
         * Tries to persist the current representation of the resource in a remote container resource.
         * The remote service should provide the URL of the newly created resource using the 'Location' header.
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
                    cb(true, err)
                });
            }

        };

        /**
         * Destroys the resource in the remote service.
         * If it is successful the resource URL is set to null;
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
                    cb(true, err)
                });
            }
        };

        /**
         * Model for a LDP resource.
         * It is designed as a RESTful resource using turtle as the representation format.
         * @param url Location of the LDP resource
         * @constructor
         */
        Networking.LDPResource =  function(url) {
            var options = {
                url: url,
                mediaType: 'text/turtle'
            };
            Networking.RESTResource.call(this,options);
        };
        Networking.LDPResource.prototype = new Networking.RESTResource();
        Networking.LDPResource.prototype.constructor = Networking.LDPResource;

        return Networking;
    });

}).call(this);