(function(undefined) {
  var root = this,

    Overlord = (function() {
      var apis = {};

      //-------------------------------------------APIs private section

      //private
      //Add new methods to facade
      function addFacadeMethod(name, methodName) {
        if (apis[name].facade) {
          apis[name].facade[methodName] = function() {
            var results = [];
            //save debug info
            apis[name].lastCall = methodName;
            for (var j = 0, k = apis[name].implementations.length; j < k; j += 1) {
              if (apis[name].stronglyTypedInterface || typeof(apis[name].implementations[j][methodName]) === 'function') { //for loosely typed don't throw errors on missing methods
                try {
                  results.push(apis[name].implementations[j][methodName].apply({}, arguments)); //passes given arguments and stores results
                } catch (e) {
                  apis[name].lastErrors.push(e);
                }
              }
            }
            return results;
          }
        }
      }


      //-------------------------------------------APIs public section

      //optional method to define a strongly typed interface for the api
      //name - API name
      //methodList - list of methods to implement or a prototype
      //returns value of `stronglyTypedInterface`, so if one puts define call in multiple places not knowing which one runs first - he will know that it was correctly defined. If false comes back - define is being called after first register call, which is bad in most cases...
      function defineInterface(name, methodListOrPrototype) {
        if (!apis[name]) {
          var strong=false,methodHash = {};
          if(methodListOrPrototype){
            strong=true;
            if (typeof(methodListOrPrototype) == typeof([])) {
              for (var i = 0, l = methodListOrPrototype.length; i < l; i += 1) {
                methodHash[methodListOrPrototype[i]] = true;
              }
            } else {
              for (var i in methodListOrPrototype) {
                if (methodListOrPrototype.hasOwnProperty(i)) {
                  methodHash[i] = true;
                }
              }
            }
          }
          apis[name] = {
            definition: methodHash,
            stronglyTypedInterface: strong,
            //is it strongly typed?
            implementations: [],
            lastErrors: [],
            lastCall: null
          };

          return apis[name].stronglyTypedInterface;
        } else {
          return apis[name].stronglyTypedInterface;
        }
      }

      //registers an object to an api
      //if interface was not defined, it creates a loosely typed interface
      //name - API name
      //object - object to be called with that api
      function register(name, object) {
        if (!apis[name]) {
          defineInterface(name); //auto loosely typed;
        }

        if (apis[name].stronglyTypedInterface) {
          for (var iMethod in apis[name].definition) {
            if (apis[name].definition.hasOwnProperty(iMethod) && typeof(object[iMethod]) != 'function') {
              throw ("Given object is not an implementation for API:" + name + ". Method " + iMethod + " is missing");
            }
          }
        } else {
          for (var iMethod in object) {
            if (object.hasOwnProperty(iMethod) && apis[name].definition[iMethod] !== true && typeof(object[iMethod]) == 'function') {
              apis[name].definition[iMethod] = true;
              addFacadeMethod(name, iMethod); //safe call, does nothing if no facade
            }
          }

        }

        //finalize by adding the object to implementation list
        apis[name].implementations.push(object);
        return object;
      }

      //Destroys the named api and prevents its facades from trying to work
      function drop(name) {
        if(apis[name]){
          //destroy the facade to be sure - it might be referenced in lots of places and I want it dead no matter what.
          apis[name].facade = null;
          delete apis[name].facade;

          //delete
          delete apis[name];
        }
      }


      //Returns a facade for a given api name
      //The facade for a name is a singleton
      //New objects registered after the facade was created are added to the facade on the fly
      function getFacade(name) {
        if (apis[name]) {
          if (apis[name].facade) {
            return apis[name].facade;
          } else {
            apis[name].facade = {};
            for (var iMethod in apis[name].definition) {
              if (apis[name].definition.hasOwnProperty(iMethod)){
                addFacadeMethod(name, iMethod);
              }
            }

            return apis[name].facade;

          }
        } else {
          //you mean what exactly?
          throw ('There is no such api: ' + name);
        }
      }

      //returns debug information for the last call to a given API
      function getDebugInfo(name) {
        if(apis[name]){
          return {
            errors: apis[name].lastErrors,
            method: apis[name].lastCall,
            apiObject: apis[name]
          }
        }else{
          return "no such api"; //this should be an error, but it's for debug purposes anyway
        }
      }

      //-------------------------------------------Pub/Sub section
      //this is a publisher/subscriber implementation on top of the extended mediator pattern

      //good old publish from pub/sub
      function publish(topic, data) {
          data = (!(data instanceof Array)) ? [data] : data;
          getFacade('SUBSCRIBTIONS:' + topic).action.apply({}, data);
      }

      //subscribe
      //returns the subscribtion object
      function subscribe(topic, callback) {
        return register('SUBSCRIBTIONS:' + topic, {
          action: callback
        });
      }

      //unsubscribe
      //provide the object returned from subscribe as an argument to turn off the subscribtion
      function unsubscribe(object) {
        delete object.action;
      }

      //-------------------------------------------Export methods
      return {

        defineInterface: defineInterface,
        register: register,
        drop: drop,
        getFacade: getFacade,
        getDebugInfo: getDebugInfo,

        publish: publish,
        subscribe: subscribe,
        unsubscribe: unsubscribe

      }
    })();


  if (typeof exports !== 'undefined') {
    //AMD if avaliable
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Overlord;
    }
    exports.Overlord = Overlord;
  } else {
    //publishing to the global space
    root.Overlord = Overlord;
  }

}).call(this);
