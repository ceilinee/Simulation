var Chef = require('./chef.js');
var Customer = require('./customer.js');
var Server = require('./server.js');

var restaurant = function(minutes,customernum,tablenum,servernum,chefnum){
    //initialize chef and servers
    var customers = [], chefs = [],servers = [],tables = [];
    initiate(customers, chefs, tables, tablenum, servernum, chefnum);
    //initialize simulation
    var waitqueue = [],chefqueue = [],event = [];
    arrivals(event,minutes,customernum);
    while(event[0].time<minutes){
        var curevent = event.shift();
        if(curevent.type == "arrival"){
            waitqueue.push(curevent.customer);
            //check server availability
            for(var i =0;i<tables.length;i++){
                //if a server is free
                if(tables[i]==0 && waitqueue.length>0){
                    var seated = waitqueue.shift()
                    tables[i]=seated;
                    seated.order = Math.floor(Math.random() * 5);
                    seated.eattime = Math.floor(Math.random() * 5);
                    seated.table = i;
                    chefqueue.push(seated);
                }
            }
            for(var i =0;i<chefs.length;i++){
              if(!chefs[i].busy && chefqueue.length>0){
                 var curorder = chefqueue.shift();
                 chefs[i].busy = true;
                 event.push({type:"chef-departure", time:curevent.time+curorder.order, customer: curorder, chef:i});
                 console.log("55"+i);
              }
            }
        }
        else if(curevent.type == "chef-departure"){
          console.log(curevent.chef);
            chefs[curevent.chef].busy = false;
            event.push({type:"departure", time:curevent.time+curevent.customer.eattime, customer: curevent.customer})
            if(chefqueue.length>0){
               var curorder = chefqueue.shift();
               chefs[curevent.chef].busy = true;
               event.push({type:"chef-departure", time:curevent.time+curorder.order, customer: curorder, chef:curevent.chef});
               console.log("68"+curevent.chef);
            }
        }
        else if(curevent.type == "departure"){
            tables[curevent.customer.table]=0;
            if(waitqueue.length>0){
              var seated = waitqueue.shift()
              tables[i]=seated;
              seated.order = Math.floor(Math.random() * 5);
              seated.eattime = Math.floor(Math.random() * 5);
              seated.table = i;
              chefqueue.push(seated);
              for(var i =0;i<chefs.length;i++){
                if(!chefs[i].busy && chefqueue.length>0){
                   var curorder = chefqueue.shift();
                   chefs[i].busy = true;
                   event.push({type:"chef-departure", time:curevent.time+curorder.order, customer: curorder, chef:i});
                   console.log("84"+i);
                }
              }
            }
            customers.push({start: curevent.customer.arrival, departure:curevent.time});
        }
        event.sort((a,b) => {return a.time - b.time});
        if(event.length==0){
          break;
        }
    }
};
var arrivals = function(event,minutes,customernum){
  var curtime = 0;
  while(curtime<customernum){
    var nextArrivalTime = Math.floor(random_normal()*100);
    var nextArrival = {type:"arrival", time:nextArrivalTime, customer: new Customer(nextArrivalTime)};
    event.push(nextArrival);
    curtime++;
  }
  event.sort((a,b) => {return a.time - b.time});
  console.log(event);
};
var random_normal = function(){
    var u = 0, v = 0;
    while(u === 0){
      u = Math.random();
    }
    while(v === 0){
      v = Math.random();
    }
    var normal = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    normal = normal / 10.0 + 0.5;
    if (normal > 1 || normal < 0){
      return random_normal();
    }
    return normal;
}
var initiate = function(servers, chefs, tables, tablenum, servernum, chefnum){
    for(var i =0; i<chefnum; i++){
      chefs[i] = new Chef(i);
    }
    for(var i =0; i<servernum; i++){
      servers[i] = new Server(i);
    }
    for(var i =0; i<tablenum; i++){
      tables[i] = 0;
    }
}
restaurant(100,30,10,2,2);
