/**
 * Created by antonio on 10/07/2014.
 */

define(["ldp_client/rdf"], function(RDF) {

    describe("ldp_client/rdf", function(){

        it("Should be possible to build an RDF graph from a turtle document and a base URI", function(done){
            var turtle = "<> a <http://test.com/Type>; <http://test.com/prop1> \"something\" .";
            var url = "http://test.com/ids/1";

            RDF.makeGraph(url, turtle, function(err, store){
                expect(err).toBeFalsy();
                store.execute('SELECT ?s WHERE { ?s <http://test.com/prop1> "something" }', function(success, res){
                    expect(success).toBeTruthy();
                    expect(res.length).toEqual(1);
                    expect(res[0].s.value).toEqual("http://test.com/ids/1");
                    done();
                });
            });
        });

    }); // end of describe("ldp_client/rdf")

}); // end of define