overlord.js
===========

Mediator pattern taken to the limits. 

Overlord is an implementation of improved madiator pattern. It is useful when decoupled modules or objects interact, but can't see (reference) each other. Mediator pattern is much more than publisher/subscriber (pubsub) but it works towards the same goal.

Overlord basically lets you register a group of objects with methods, and use them as one common API to not only call methods, but *receive results*. 


## Methods:

      Overlord: {
          defineInterface
          register
          getFacade
          drop
          getDebugInfo
        }


    
###Overlord.register(name,object)

Registers an object as an implementation to an API. 

`name` - string, name to identify the api
`object` - an object with methods that should be avaliable to the world.

 - if the API is loosely typed (by default, no `defineInterface` call was made for this API), all the methods of the `object` will be avaliable to the caller. Other objects can have different set of methods.
 
 - if the API is strongly typed (there is a definition of methods), the `register` function throws an error for objects that don't have all the methods from the list. All methods not from the list are ignored.


 
###Overlord.getFacade(name) 

Returns an object (a singleton, only one instance for each API name) that has all the methods avaliable in the selected API. Calling a method from the facade triggers execution of the same method from all objects registered for that API. Errors thrown by methods don't stop the execution. Returned values from all successful calls are returned as an array. Errors are avaliable via `getDebugInfo`

`name` - string, name to identify the api

###Overlord.defineInterface(name,definition)

Defines that all object registered for a given name must implement an interface. Defining interfaces is *optional*. If no interface is defined prior to the first register call, the API becomes loosely typed and all methods from all registered objects are avaliable safely. (no `object has no method...` errors)

`name` - string, name to identify the api
`definition` - array or object, definition of methods that must exist in all registered objects.
 - if `definition` is an array, all elements in array become names of required methods in objects for that API
 - otherwise this method assumes that `definition` is an object and the list of its fields becomes the list of required methods, therefore it is equally correct to use following objects as definitions:
 
        //a hash of truthy values
        {
        method1:true,
        method2:true
        }
        
        //an object with methods
        {
        method1:function(){/*real function*/},
        method2:function(){/*real function*/}
        }
        
        //a mix
        {
        method1:function(){/*real function*/},
        method2:123
        }
    
`defineInterface` returns a boolean value. The returned value states if there is an interface definition for that API name. Therefore it returns true when it succeeds in defining an interface OR if the interface was already defined and false only when the API had an object registered before any attempt of defining an interface was made. This allows the developer to put multiple `defineInterface` calls in the code and react only if all of them failed to be called before first object was registered.


###Overlord.drop(name)

Destroys the API. Cleans the facade object to be sure that it doesn't stay avaliable via a reference from somewhere else. 

This method is intended mostly for testing purposes. If you want to use this function you are probably doing something wrong. 

`name` - string, name to identify the api

###Overlord.getDebugInfo(name)

Returns a hash with the following information:
errors: an array of errors thrown in calls from the most recent facade method invocation
method: the name of the recently called method
apiObject: internal object with the whole API definition, state and the facade instance

`name` - string, name to identify the api

## Proof of concept publisher/subscriber implementation

###Overlord.publish(topic,data)

Publishes information to all subscribers of the `topic`. `data` is a list of arguments to be passed.

###Overlord.subscribe(topic,callback)

Subscribes a function to a `topic`. Returns an object that can be passed to the `unsubscribe` method

###Overlord.unsubscribe(subscriptionObject)

Prevents the subscription defined by `subscriptionObject` from reacting to publications.



## Example of usage: 

    //line for node.js
    var Overlord=require('./overlord.js').Overlord;
    
    Overlord.defineInterface('myAPIName',['q','w']); //optional, if you want to get errors when object has no method on registration
    Overlord.register('myAPIName',{q:function(a){return ++a;},w:function(a){return --a;}});
    Overlord.register('myAPIName',{q:function(a){return a+2;},w:function(a){return a.misspeledPropName.something;}});
    var f=Overlord.getFacade('myAPIName');

    f.q(11);
    [ 12, 13 ]
    
    Overlord.getDebugInfo('myAPIName');
    { errors: [], method: 'q', apiObject: ... }
    
    f.w(11)
    [ 10 ]
    Overlord.getDebugInfo('myAPIName')
    { errors: [
          { 
            stack: [Getter/Setter],
            arguments: [Object],
            type: 'non_object_property_load',
            message: [Getter/Setter] 
          }
        ],
      method: 'w',
      apiObject: { 
         definition: { q: true, w: true },
         stronglyTypedInterface: true,
         implementations: [ [Object], [Object] ],
         lastErrors: [ [Object] ],
         lastCall: 'w',
         facade: { q: [Function], w: [Function] } 
       }
    }

    

