let Chef = require('./chef.js');
let Customer = require('./customer.js');
let Server = require('./server.js');

var restaurant = function(minutes,customernum,tablenum,servernum,chefnum){
    //initialize chef and servers
    let customers = [], chefs = [],servers = [],tables = [], earnings = 0;
    initiate(customers, chefs, tables, tablenum, servernum, chefnum);
    //initialize simulation
    let table_queue = [],chef_queue = [],event = [];
    arrivals(event,minutes,customernum);
    while(event.length>0 && event[0].time<minutes){
        let curevent = event.shift();
        if(curevent.type == "arrival"){
            //add curevent to end of the table_queue
            table_queue.push(curevent.customer);
            //check server availability
            for(let i =0;i<tables.length;i++){
                //if a server is free
                if(tables[i]==0 && table_queue.length>0){
                    let seated = table_queue.shift()
                    tables[i]=seated;
                    seated.order_prep_time = Math.floor(Math.random() * 10);
                    earnings += seated.order_prep_time;
                    seated.time_to_eat = Math.floor(Math.random() * 20);
                    seated.wait_for_table = curevent.time-seated.arrival;
                    seated.table = i;
                    chef_queue.push(seated);
                }
            }
            for(let i =0;i<chefs.length;i++){
              if(!chefs[i].busy && chef_queue.length>0){
                 let curorder = chef_queue.shift();
                 chefs[i].busy = true;
                 curorder.chef = chefs[i].id;
                 event.push({type:"dish-complete", time:curevent.time+curorder.order_prep_time, customer: curorder, chef:i});
              }
            }
        }
        else if(curevent.type == "dish-complete"){
            chefs[curevent.chef].busy = false;
            curevent.customer.wait_for_dish = curevent.time - (curevent.customer.arrival + curevent.customer.wait_for_table);
            event.push({type:"departure", time:curevent.time+curevent.customer.time_to_eat, customer: curevent.customer})
            if(chef_queue.length>0){
               let curorder = chef_queue.shift();
               chefs[curevent.chef].busy = true;
               curorder.chef = chefs[curevent.chef].id;
               event.push({type:"dish-complete", time:curevent.time+curorder.order_prep_time, customer: curorder, chef:curevent.chef});
            }
        }
        else if(curevent.type == "departure"){
            tables[curevent.customer.table]=0;
            if(table_queue.length>0){
              let seated = table_queue.shift()
              tables[curevent.customer.table]=seated;
              seated.order_prep_time = Math.floor(Math.random() * 10);
              earnings += seated.order_prep_time;
              seated.time_to_eat = Math.floor(Math.random() * 20);
              seated.wait_for_table = curevent.time-seated.arrival;
              seated.table = curevent.customer.table;
              //Check if a chef can
              chef_queue.push(seated);
              for(let i =0;i<chefs.length;i++){
                if(!chefs[i].busy && chef_queue.length>0){
                   let curorder = chef_queue.shift();
                   chefs[i].busy = true;
                   curorder.chef = chefs[i].id;
                   event.push({type:"dish-complete", time:curevent.time+curorder.order_prep_time, customer: curorder, chef:i});
                }
              }
            }
            curevent.customer.departure = curevent.time;
            customers.push(curevent.customer);
        }
        event.sort((a,b) => {return a.time - b.time});
    }
    console.log(customers,earnings);
};
var arrivals = function(event,minutes,customernum){
    let curtime = 0;
    while(curtime<customernum){
        let nextArrivalTime = Math.floor(random_normal()*minutes);
        let nextArrival = {type:"arrival", time:nextArrivalTime, customer: new Customer(nextArrivalTime)};
        event.push(nextArrival);
        curtime++;
    }
    event.sort((a,b) => {return a.time - b.time});
    console.log(event);
};
var random_normal = function(){
    let u = 0, v = 0;
    while(u === 0){
        u = Math.random();
    }
    while(v === 0){
        v = Math.random();
    }
    let normal = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    normal = normal / 10.0 + 0.5;
    if (normal > 1 || normal < 0){
        return random_normal();
    }
    return normal;
}
var initiate = function(servers, chefs, tables, tablenum, servernum, chefnum){
    for(let i =0; i<chefnum; i++){
        chefs[i] = new Chef(i);
    }
    for(let i =0; i<servernum; i++){
        servers[i] = new Server(i);
    }
    for(let i =0; i<tablenum; i++){
        tables[i] = 0;
    }
}
restaurant(480,100,10,2,2);
