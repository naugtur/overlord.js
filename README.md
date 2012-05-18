overlord.js
===========

Mediator pattern taken to the limits. Can do more than just PubSub

TODO: create documentation and examples;


## Overlord footprint:

    {
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

## Test case: 

  >  var O=require('./overlord.js').Overlord;
  >  O.API.define('a',['q','w']);
  >  O.API.register('a',{q:function(a){return ++a;},w:function(a){return --a;}});
  { q: [Function], w: [Function] }
  >  O.API.register('a',{q:function(a){return a+2;},w:function(a){return a-2;}});
  { q: [Function], w: [Function] }
  >  var f=O.API.getFacade('a');
  > f.q(11);
  [ 12, 13 ]
  > O.API.getDebugInfo('a');
  { errors: [], method: 'q' }
  > f.w(11);
  [ 10, 9 ]
  > O.API.getDebugInfo('a');
  { errors: [], method: 'w' }


