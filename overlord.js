(function(undefined) {
  var root = this,
  
  Overlord = (function() {
    var topics = {},
      topicsSequence = 1,
      apis = {};

    //-------------------------------------------Pub/Sub section
    //subscribe
    //name - optional
    //returns name (generated if not given)


    function sub(topic, functionToCall, name) {
      if (typeof(functionToCall) != 'function') {
        return false;
      }
      if (!topics[topic]) {
        topics[topic] = [];
      }
      name = (name) ? name : topicsSequence++;
      topics[topic][name] = functionToCall;
      return name;
    }

    //unsubscribe 
    //unsubscribes an named subscribtion


    function unSub(topic, name) {
      if (!topics[topic] || name === undefined) {
        return false;
      } else {
        delete topics[topic][name];
        return true;
      }
    }

    //publish
    //data - optional


    function pub(topic, data) {
      if (topics[topic]) {
        for (var i in topics[topic]) {
          if (topics[topic].hasOwnProperty(i)) {
            topics[topic][i].apply({}, data);
          }
        }
        return true;
      } else {
        return false;
      }
    }

    //publish
    //runs every subscriber separately and doesn't fail if one of them throws an error
    //data - optional
    //returns encountered errors


    function pubSafe(topic, data) {
      var errors = [];
      if (topics[topic]) {
        for (var i in topics[topic]) {
          if (topics[topic].hasOwnProperty(i)) {
            try {
              topics[topic][i].apply({}, data);
            } catch (e) {
              errors.push(e);
            }
          }
        }
        return (errors.length) ? errors : true;
      } else {
        return false;
      }
    }

    //-------------------------------------------APIs section

    function define(name, methodList) {
      if (!apis[name]) {
        apis[name] = {
          definition: methodList,
          implementations: [],
          lastErrors: [],
          lastCall: null
        };
      }
    }

    function register(name, object) {
      if (!apis[name]) {
        throw ("Missing interface definition");
      }
      for (var i = 0, l = apis[name].definition.length; i < l; i += 1) {
        if (apis[name].definition.hasOwnProperty(i) && typeof(object[apis[name].definition[i]]) != 'function') {
          throw ("Given object is not an implementation for API:" + name + ". Method " + apis[name].definition[i] + " is missing");
        }
      }
      apis[name].implementations.push(object);
      return object;
    }

    function drop(name) {
      apis[name].implementations = [];
    }

    function wrapRunAll(name, i) {

    }

    function getFacade(name) {
      if (apis[name].facade) {
        return apis[name].facade;
      } else {
        var facade = {};
        for (var i = 0, l = apis[name].definition.length; i < l; i += 1) {
          if (apis[name].definition.hasOwnProperty(i)) {
            facade[apis[name].definition[i]] = (function() {
              var methodName = apis[name].definition[i]; //store method name in scope
              return function() {
                var results = [];
                //save debug info
                apis[name].lastCall = methodName;
                for (var j = 0, k = apis[name].implementations.length; j < k; j += 1) {
                  try {
                    results.push(apis[name].implementations[j][methodName].apply({}, arguments)); //passes given arguments and stores results
                  } catch (e) {
                    apis[name].lastErrors.push(e);
                  }
                }
                return results;
              }
            })();
          }
        }

        apis[name].facade = facade;
        return facade;

      }

    }
    
    function getDebugInfo(name){
      return {
        errors: apis[name].lastErrors,
        method: apis[name].lastCall
        }
      }

    return {
      publish: pub,
      publishSafe: pubSafe,
      subscribe: sub,
      unsubscribe: unSub,
      API: {
        define: define,
        register: register,
        drop: drop,
        getFacade: getFacade,
        getDebugInfo: getDebugInfo
      }

    }
  })();

 //publishing: to the global space
 //TODO: AMD if avaliable
 root.Overlord=Overlord;

}).call(this);


