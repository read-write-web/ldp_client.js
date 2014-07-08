/**
 * Created by antonio on 08/07/2014.
 */

describe("ldp::networking", function(){

    describe("LDPResource", function(){

        define(["ldp_client/networking"], function(Networking) {
            it("should be able to discover a remote resource", function (done) {
                Networking.LDPResource.metadata("/", function(err, metadata){
                    expect(err).toEqual(false);
                    expect(metadata.type).toEqual("http://www.w3.org/ns/ldp#BasicContainer");
                    done();
                });
            });
        });

    });

});