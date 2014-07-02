LDP JS Client
=============


The goal of this project is the creation of a JavaScript client library that can be used to build complex JavaScript applications backed by LDP resources.

The library should work as an intermediate component between the data layer of the application and the remote LDP resources retrieved from the web. It should be possible to integrate the library with different JavaScript frameworks like Backbone.JS or Angular.JS to provide a full blown solution for the construction of JavaScript client applications.

Some of the design goals of this project are:

- Simplify the interaction with remote LDP resources and containers, making it easy to retrieve, create and discover LDP resources, taking into account the security restrictions on those resources.
- Provide a way to transform the remote RDF graphs extracted from remote LDP resources into domain objects that can be used in the data layer of the application.
- Map CRUD operations over domain objects into the appropriate HTTP requests to the remote LDP resources backing the domain objects.
- Trigger the required events when domain objects are manipulated.


The main problem the library must solve is the mapping from LDP resources into domain objects and from CRUD operations over domain objects into HTTP operations over LDP resources.
LDP resources can contain RDF graphs with a number of RDF resources from different vocabularies. When this graph has been retrieved by the client it could transformed into an arbitrary number of domain objects encapsulating a subset of the triples retrieved from the LDP resource and some operations over those triples.
This is a change from traditional JSON APIs where there is usually a 1:1 correspondence between resources and domain model objects.
Any modification of domain objects through a CRUD operation requires an equivalent HTTP operation on the remote LDP resource to keep the state of the resource in sync with the local state of the application.
Another related problem is the creation of new domain objects that need to be persisted into a compatible LDP container if they are going to be stored as a new resource or modifying the state of a LDP resource where the triples for the new domain object are inserted.

Architecture
------------

The following diagram shows a possible high level design for the library including its main components:

![architecture diagram](doc/images/architecture.png)

- RESTful connector:

This component will take care of interacting with the remote LDP resources and containers using the HTTP protocol as it is specified in the LDP W3C recommendation.
It should hide all the details regarding the network transport of the resource representation as well as the discovery of meta-data about the resources.

- Local RDF graph:

RDF data extracted from the representations of the LDP resources will be merged into a single RDF graph stored locally into the client. Upper layers of the application will work directly with the local RDF graph without needing any direct knowledge of the underlying LDP resources.

- Resource graph tracker:

This component should record the source of any triple stored in the local application graph so it is possible to know what resources are in an inconsistent state when parts of the local RDF are modified due to CRUD operations.

- Object graph mapper:

This component should provide the basis for all the domain objects in the data layer. It should provide the right mechanism for the definition of the state of a domain object as a subgraph of the local RDF graph in a similar way as a ORM library works on top of a relational data base.
It should also provide basic support for CRUD operations on the domain object triples: modification and deletion, as well as the way of making these changes persistent in the remote LDP resources backing the object. It should also provide mechanisms for finding model objects in the RDF graph, arrange them in ordered collections and to create new objects and persist them in a remote LDP container.

- Event binding mechanism:

Modifications in any domain object or the underlying RDF graph should generate the appropriate set of events that can be used to update the state of other components or libraries to changes in the data model.
This mechanism should make it easy to integrate the library with other JavaScript application frameworks using some glue code.


Building
--------

The project uses NodeJS Grunt tool to build the project and Bower to manage JS dependencies.

First install Grunt and Bower dependencies using NPM from the root directory of the project:
 
 ```bash
 $ npm install
 ```
 The dependencies for the library can be retrieved using bower:
 
 ```bash
 $ bower install
 ```
 
 After this, the library can be built with the 'build' target:
  ```bash
 $ grunt build
 ```
 
 The resulting source code will be generated in the 'dist' directory in the top level directory of the project.
 
 Deploying
 ---------

 This is work in progress. This is just a brief description of how get something running in the browser.
 To deploy the code copy the 'dist' directory and the 'bower_components' directories into the assets directory of a rww-play LDP server:
 
 ```bash
 $ mkdir -p rww-play/public/client
 $ cp -rf bower_components rww-play/public/bower_components
 $ cp -rf dist/* rww-play/public/client/
 ```
 
 Then you can write some HTML loading the main script in the library, using require.js (included in the Bower deps)
 
 ```bash
 $ emacs rww-play/public/client/index.html
 ```
 
 ```html
 <html>
   <head>
     <script data-main="main" src="../bower_components/requirejs/require.js"></script>
   </head>
   <body>
     <h1>Testing the library...</h1>
   </body>
 </html>
 ```
 
 You can now test the library from any sub-domain in the rww-play server e.g:
 
 https://test.localhost:8443/assets/client/index.html
 
 If everything goes ok, you should see something like this in the console:
 
 ```text
 =================================================== main.js:36
 ** success GET container:  main.js:37
 / main.js:38
 =================================================== main.js:53
 ** success PARSE container RDF:  main.js:54
 Store.Store {functionMap: Object, customFns: Object, engine: QueryEngine.QueryEngine, rdf: RDFJSInterface.RDFEnvironment, registerCustomFunction: function…}
  main.js:55
 =================================================== main.js:70
 ** success SPARQL querying the container:  main.js:71
 <> a <http://www.w3.org/ns/ldp#BasicContainer> main.js:73
 <> a <http://www.w3.org/ns/ldp#Container> main.js:73
 =================================================== main.js:91
 ** success POST resource:  main.js:92
 https://test.localhost:8443/23269d69d7 main.js:93
 =================================================== main.js:110
 ** success PUT resource:  main.js:111
 <> a <foaf:Person>; <foaf:name> "foo2" . main.js:112
 =================================================== main.js:127
 ** success DELETE resource:  main.js:128
 null 
 ```
  