/**
 * Created by antonio on 10/07/2014.
 */

define(["ldp_client/rdf", "async"], function(RDF, async) {

    describe("ldp_client/rdf", function(){

        it("should be possible to build an RDF graph from a turtle document and a base URI", function(done){
            var turtle = '<> a <http://test.com/Type>; <http://test.com/prop1> "something" .';
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

        it("should be possible to insert/remove data into a RDF graph", function(done){
            var turtle = '<> a <http://test.com/Type>; <http://test.com/prop1> "something" .';
            var url = "http://test.com/ids/1";
            var graph;

            async.series([

                // Load initial data
                function(cb) {
                    RDF.makeGraph(url, turtle, function(err, store){
                        graph = store;
                        expect(err).toBeFalsy();
                        graph.execute('SELECT ?s WHERE { ?s <http://test.com/prop1> "something2" }', function(success, res){
                            expect(success).toBeTruthy();
                            expect(res.length).toEqual(0);

                            cb();
                        });
                    });
                },

                // Insert more data
                function(cb) {
                    RDF.insertIntoGraph(graph, '<> <http://test.com/prop1> "something2"', function(err) {
                        expect(err).toBeFalsy();
                        graph.execute('SELECT ?s WHERE { ?s <http://test.com/prop1> "something2" }', function(success, res){

                            expect(success).toBeTruthy();
                            expect(res.length).toEqual(1);

                            cb();
                        });
                    })
                },

                // Remove inserted data
                function(cb) {
                    RDF.removeFromGraph(graph, '<'+url+'> <http://test.com/prop1> "something2"', function(err) {
                        expect(err).toBeFalsy();
                        graph.execute('SELECT ?s WHERE { ?s <http://test.com/prop1> "something2" }', function(success, res){

                            expect(success).toBeTruthy();
                            expect(res.length).toEqual(0);

                            cb();
                        });
                    })
                }

            ],function(err){
                expect(err).toBeFalsy();
                done();
            });

        });

    }); // end of describe("ldp_client/rdf")

}); // end of define