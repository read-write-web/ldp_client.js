/**
 * Created by antonio on 08/07/2014.
 */

describe("ldp::networking", function(){

    describe("LDPResource", function(){
        define(["ldp_client/networking"], function(Networking) {
            it("should be loaded", function () {
                expect(true).toEqual(true);
            });
            it("should load the networking module", function(){
                expect(Networking).not.toBeNull();
            });
        });
    });

});