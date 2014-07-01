/**
 * Created by antonio on 30/06/2014.
 */
(function() {

    /**
     * This module will expose the main interface of the library when it is finished.
     * Right now is just a way of exposing the modules being written so they can be tested.
     */
    define('ldp_client', ["ldp_client/networking"], function(Networking) {

        var LDPClient = function() {

        };

        LDPClient.LDPResource = Networking.LDPResource;

        return LDPClient;
    });

}).call(this);